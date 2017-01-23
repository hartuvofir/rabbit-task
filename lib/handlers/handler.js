/**
 * Created by asafdavid on 09/12/2015.
 */
var _ = require('lodash');
var logger = require('../logger');
var TemporaryError = require('../temporaryError');
var HandlerResponse = require('./handlerResponse');

function MsgHandler(name, pattern) {
  this.name = name;
  this.pattern = pattern;
}

/**
 * Validates if the wanted pattern match the provided handler msg
 * There are 4 options:
 * 1. Array of topics
 * 2. RegEx pattern
 * 3. Object where the keys are the topics
 * @param topic
 */
MsgHandler.prototype.match = function(topic) {
  // If array, check if the topic is inside the array
  if (_.isArray(this.pattern)) {
    return (this.pattern.indexOf(topic) != -1);
  }

  // If RegEx check the match
  if (_.isRegExp(this.pattern)) {
    return (topic.match(this.pattern) != null);
  }

  // If object, check if the topic is part of the object
  if (_.isObject(this.pattern)) {
    return this.pattern.hasOwnProperty(topic);
  }

  // Else, pattern is a string
  return (this.pattern === topic);
};

/**
 * Default msg handler - does nothing
 * @param msg
 */
MsgHandler.prototype.doHandle = function(msg) {
  return Promise.resolve(undefined);
};

/**
 * Handle the reply to a queue and ack the message
 * Handles response if it is HandlerResponse, acceptable sending type (string/number/[string]/[number]) or a general
 * object to stringify.
 * @param sender - sender object
 * @param msg - the original message to response to
 * @param res - string or handlerResponse
 * @param headers - headers to append to to response
 * @returns {*}
 */
MsgHandler.prototype.reply = function(sender, msg, res, headers) {
  if (!!res && this.shouldReply(msg, res)) {
    logger.instance.info('[MsgHandler] replies to a msg with tag', msg.fields.consumerTag);
    try {
      var body;
      var replyQueue;
      var options;
      if (res instanceof HandlerResponse) {
        body = res.messageBody;
        replyQueue = res.replyTo;
        options = res.getMessageOptions();
      } else {
        // if acceptable type use res as body, otherwise stringify
        body = (_.isString(res) || _.isNumber(res) || _.isArray(res)) ?
          res :
          JSON.stringify(res);

        replyQueue = msg.properties.replyTo;
        options = sender.buildOptionsFromMsg(msg, headers);
      }

      // If no reply queue was defined
      if (!replyQueue) {
        sender.error(msg, 'No reply queue was defined');
      }
      else {
        sender.reply(body, replyQueue, options);
      }
    } catch (e) {
      logger.instance.error('[MsgHandler] an unexpected error has while attempting to reply to the msg with tag:' +
        msg.fields.consumerTag + '\nError was ' + e.stack || e.toString() + '\nresponse was: ' + res.messageBody || res);
      return Promise.reject(e);
    }
  }
  logger.instance.info('[MsgHandler] acks a msg with tag: ', msg.fields.consumerTag);
  sender.ack(msg);
};

/**
 * Abstact message handler, handles acks and nacks so each handler won't have to be aware of the channel.
 * This function have two hooks: preHandle - before doHandle function, and postHandle - after doHandle function
 * @param sender
 * @param msg
 * @param promise
 * @returns {Promise.<T>}
 */
MsgHandler.prototype.handle = function(sender, msg) {
  var self = this;
  return this.preHandle(msg).then(this.doHandle.bind(this)).then(this.postHandle.bind(this)).then(function(res) {
    // Message handled successfully, in case a result was given send it back.
    self.reply(sender, msg, res);
    return res;
  }).catch(function (err) {
    logger.instance.error('[MsgHandler] received the following error from handler: ', err);
    // If error is NOT of the temporary type, reply as error, otherwise reinsert it back to the message queue
    // Or if the TemporaryError has no retries left
    if (!(err instanceof TemporaryError) || msg.properties.headers['x-attempts-left'] <= 1) {
      self.reply(sender, msg, err, {isError: true});
    } else {
      if (sender.nackExchange) {
        logger.instance.error('[MsgHandler] app-nacks a msg with tag: ', msg.fields.consumerTag);
        sender.appNack(msg);
      } else {
        logger.instance.error('[MsgHandler] nacks a msg with tag: ', msg.fields.consumerTag);
        sender.nack(msg);
      }
    }
    return Promise.reject(err);
  });
};

/**
 * Checks if a response should be sent back as a reply to a reply queue
 * @param originalMessage - the original message to response to
 * @param response - the response for the original message
 * @returns {boolean}
 */
MsgHandler.prototype.shouldReply = function(originalMessage, response) {
  if (response instanceof HandlerResponse) {
    return !!response.replyTo;
  } else {
    return !!originalMessage.properties.replyTo;
  }
};

/**
 * Pre handle function, occured before the doHandle function
 * Get the message from the queue, and return it to doHandle with Promise
 * @param msg
 * @returns {Promise.<*>}
 */
MsgHandler.prototype.preHandle = function(msg) {
  return Promise.resolve(msg);
};

/**
 * Post handle function, occurred after the doHandle function
 * Get the message from the doHandle function, and return it to handle function
 * @param msg
 * @returns {Promise.<*>}
 */
MsgHandler.prototype.postHandle = function(msg) {
  return Promise.resolve(msg);
};

/**
 * Basic initial handling from messages that are expected to arrive in JSON format
 * Parses the message to and returns the object as a promise result.
 * In case parsing has failed, returns a rejected promise with the a SyntaxError
 * @param {string} msg - JSON formatted string message
 * @returns {Promise}
 */
MsgHandler.prototype.parseJson = function (msg) {
  var msgBody = msg.content.toString();
  logger.instance.info('[MsgHandler] handles msg', {body: JSON.parse(msgBody)});

  var parsedMessage;
  try {
    parsedMessage = JSON.parse(msgBody);
  } catch(e) {
    logger.instance.error(
      '[MsgHandler] handler expected a message in a JSON format, but received the following',
      { body: msgBody,  err: e.message}
    );
    return Promise.reject(new SyntaxError(this.constructor.name + ' received a badly formatted JSON message'));
  }

  return Promise.resolve(parsedMessage);
};

module.exports = MsgHandler;