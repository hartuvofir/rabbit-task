/**
 * Created by asafdavid on 09/12/2015.
 */
var _ = require('lodash');

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
 * Abstact message handler, handles acks and nacks so each handler won't have to be aware of the channel.
 * This function have two hooks: preHandle - before doHandle function, and postHandle - after doHandle function
 * @param sender
 * @param msg
 * @param promise
 * @returns {Promise.<T>}
 */
MsgHandler.prototype.handle = function(sender, msg) {
  return this.preHandle(msg).then(this.doHandle.bind(this)).then(this.postHandle.bind(this)).then(function(res) {
    // Message handled successfully, in case a result was given send it back.
    if (!!res) {
      console.info('[MsgHandler] replies to a msg with tag: ' + msg.fields.consumerTag);
      try {
        replyToSender(sender, msg, res);
      } catch (e) {
        console.error('[MsgHandler] an unexpected error has while attempting to reply to the msg with tag:' +
          msg.fields.consumerTag + '\nError was ' + e.stack || e.toString() + '\nresponse was: ' + res.messageBody || res);
        return Promise.reject(e);
      }
    }
    console.info('[MsgHandler] acks a msg with tag: ', msg.fields.consumerTag);
    sender.ack(msg);
  }).catch(function (err) {
    console.error('[MsgHandler] received the following error from handler: ' + err.stack || err);
    // If error is NOT of the temporary type, reply as error, otherwise reinsert it back to the message queue
    if (!(err instanceof TemporaryError)) {
      sender.error(msg, (err && err.message) ? err.message :
      'Handler did not provide appropriate error, err obj was: ' + err);
      console.info('[MsgHandler] acks a msg with tag: ', msg.fields.consumerTag);
      sender.ack(msg);
    } else {
      if (sender.nackExchange) {
        console.error('[MsgHandler] app-nacks a msg with tag: ', msg.fields.consumerTag);
        sender.appNack(msg);
      } else {
        console.error('[MsgHandler] nacks a msg with tag: ', msg.fields.consumerTag);
        sender.nack(msg);
      }
    }
  });
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
 * Inner logic for handling a handler response.
 * Handles response if it is HandlerResponse, acceptable sending type (string/number/[string]/[number]) or a general
 * object to stringify.
 * @param sender - sender object
 * @param originalMessage - the original message to response to
 * @param {HandlerResponse|string|number|[string]|[number]|object} response
 */
function replyToSender(sender, originalMessage, response) {
  var body;
  var replyQueue;
  var options;
  if (response instanceof HandlerResponse) {
    body = response.messageBody;
    replyQueue = response.replyTo;
    options = response.getMessageOptions();
  } else {
    // if acceptable type use response as body, otherwise stringify
    body = (_.isString(response) || _.isNumber(response) || _.isArray(response)) ?
      response :
      JSON.stringify(response);

    replyQueue = originalMessage.properties.replyTo;
    options = sender.buildOptionsFromMsg(originalMessage);
  }

  // If no reply queue was defined
  if (!replyQueue) {
    sender.error(originalMessage, 'No reply queue was defined');
  }
  else {
    sender.reply(body, replyQueue, options);
  }
}

/**
 * Basic initial handling from messages that are expected to arrive in JSON format
 * Parses the message to and returns the object as a promise result.
 * In case parsing has failed, returns a rejected promise with the a SyntaxError
 * @param {string} msg - JSON formatted string message
 * @returns {Promise}
 */
MsgHandler.prototype.parseJson = function (msg) {
  var msgBody = msg.content.toString();
  console.info('[MsgHandler] handles msg:\n' + msgBody);

  var parsedMessage;
  try {
    parsedMessage = JSON.parse(msgBody);
  } catch(e) {
    console.error('[MsgHandler] handler expected a message in a JSON format, but received the following: \n ' + msgBody +
      'original error message was: ' + e.message);
    return Promise.reject(new SyntaxError(this.constructor.name + ' received a badly formatted JSON message'));
  }

  return Promise.resolve(parsedMessage);
};

module.exports = MsgHandler;