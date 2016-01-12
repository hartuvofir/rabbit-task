/**
 * Created by asafdavid on 10/12/2015.
 */
var DEFAULT_MAX_ATTEMPTS = 3;
var _ = require('lodash');

/**
 * Responsible for sending messages to the AMQP server
 * @param channel
 * @constructor
 */
function Sender(channel, errorExchange, nackExchange) {
  this.channel = channel;
  this.errorExchange = errorExchange;
  this.nackExchange = nackExchange;
}

/**
 * Publishes a message using through the opened channel
 * @param exchange
 * @param queue
 * @param msg
 * @param options
 */
Sender.prototype.publish = function(exchange, routingKey, msg, options) {
  return this.channel.publish(exchange, routingKey, msg, options);
};

/**
 * Publishes a message directly to the provided queue
 * @param exchange
 * @param queue
 * @param msg
 * @param options
 */
Sender.prototype.sendToQueue = function(queue, msg, options) {
  return this.channel.sendToQueue(queue, msg, options);
};

/**
 * Extracts an option object based on rabbit-task message format
 * @param msg
 * @returns {{}}
 */
Sender.prototype.buildOptionsFromMsg = function(msg, headers, fields) {
  headers = headers || {};
  fields = fields || {};
  var correlationId = msg.properties.messageId;
  var topic = !!msg.properties.headers ? msg.properties.headers.topic : '';

  // returns the options object based on rabbit-task format
  var options = _.extend({correlationId: correlationId}, fields);
  options.headers = _.extend({
    topic: topic
  }, headers);
  return options;
};

/**
 * Reports an error to the error queue
 * @param msg
 * @param reason
 */
Sender.prototype.error = function(msg, reason) {
  console.info('[Sender] reports an error of a msg:' + msg.fields.consumerTag);
  this.publish(this.errorExchange, msg.fields.routingKey, msg.content, {
    headers: {
      error: reason
    }
  });
};

/**
 * Applicative nack,
 * verfies if the maxium attempts was reached, in case not publishes the message to the nack exchange.
 * the message would be acked anyway.
 * @param msg
 */
Sender.prototype.appNack = function(msg) {
  var attempts = msg.properties.headers['x-attempts-left'];
  attempts = attempts ? attempts - 1 : DEFAULT_MAX_ATTEMPTS - 1;
  if (attempts > 0) {
    var options = buildOptionsFromMsg(msg, {'x-attempts-left': attempts});
    this.publish(this.nackExchange, msg.fields.routingKey, msg.content, options);
  }
  return this.ack(msg);
};


/**
 * Send a response to to queue
 * @param {object} options - Metadata options for message.
 * @param {string} queueName - The name of the queue the response should be send to.
 * @param {string|number|[string]|[number]} response
 */
Sender.prototype.reply = function(response, queueName, options) {
  if (!!queueName) {
    this.sendToQueue(queueName, new Buffer(response), options);

    return Promise.resolve(true);
  } else {
    return Promise.reject(new Error('No reply queue was defined'));
  }
};

/**
 * Acks a message
 * @param msg
 */
Sender.prototype.ack = function(msg) {
  return this.channel.ack(msg);
}

/**
 * Nacks a message
 * @param msg
 * @returns {{deliveryTag, multiple, requeue}}
 */
Sender.prototype.nack = function(msg) {
  return this.channel.nack(msg);
}

module.exports = Sender;