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
 * @param routingKey
 */
MsgHandler.prototype.match = function(routingKey) {
  // If array, check if the topic is inside the array
  if (_.isArray(this.pattern)) {
    return (this.pattern.indexOf(routingKey) != -1);
  }

  // If RegEx check the match
  if (_.isRegExp(this.pattern)) {
    return (routingKey.match(this.pattern) != null);
  }

  // If object, check if the topic is part of the object
  if (_.isObject(this.pattern)) {
    return this.pattern.hasOwnProperty(routingKey);
  }

  // Else, pattern is a string
  return (this.pattern === routingKey);
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
 * @param msg
 */
MsgHandler.prototype.handle = function(sender, msg) {
  return this.doHandle(msg).then(function(res) {
    // Message handled successfully, in case a result was given send it back.
    if (!!res) {
      console.info('[MsgHandler] replies to a msg with tag: ' + msg.fields.consumerTag);
      try {
        replyToSender(sender, msg, res);
      } catch (e) {
        console.error(`[MsgHandler] an unexpected error has while attempting to reply to the msg with tag:\
${msg.fields.consumerTag}\nError was ${e.stack || e.toString()}\nresponse was: ${res.messageBody || res}`);
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
 * Inner logic for handling a handler response.
 * Handles response if it is HandlerResponse, acceptable sending type (string/number/[string]/[number]) or a general
 * object to stringify.
 * @param sender - sender object
 * @param originalMessage - the original message to response to
 * @param {HandlerResponse|string|number|[string]|[number]|object} response
 */
function replyToSender(sender, originalMessage, response) {
  var body;
  var replayQueue;
  var options;
  if (response instanceof HandlerResponse) {
    body = response.messageBody;
    replayQueue = response.replyTo;
    options = response.getMessageOptions();
  } else {
    // if acceptable type use response as body, otherwise stringify
    body = (_.isString(response) || _.isNumber(response) || _.isArray(response)) ?
      response :
      JSON.stringify(response);

    replayQueue = originalMessage.properties.replyTo;
    options = sender.buildOptionsFromMsg(originalMessage);
  }

  sender.reply(body, replayQueue, options);
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
  console.info(`[MsgHandler] handles msg:\n${msgBody}`);

  console.log('msgBody', msgBody);
  var parsedMessage;
  try {
    parsedMessage = JSON.parse(msgBody);
  } catch(e) {
    console.error(`[MsgHandler] handler expected a message in a JSON format, \
but received the following: \n${msgBody}
original error message was: ${e.message}`);
    return Promise.reject(new SyntaxError(`${this.constructor.name} received a badly formatted JSON message`));
  }

  return Promise.resolve(parsedMessage);
};

module.exports = MsgHandler;