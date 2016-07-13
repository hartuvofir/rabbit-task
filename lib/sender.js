/**
 * Created by asafdavid on 10/12/2015.
 */
var DEFAULT_MAX_ATTEMPTS = 3;
var DEFAULT_MESSAGE_TIMEOUT_INTERVAL = 5000;
var DEFAULT_QUEUE_EXPIRATION = 90000;
var _ = require('lodash');
var logger = require('./logger');

/**
 * Responsible for sending messages to the AMQP server
 * @param channel
 * @constructor
 */
function Sender(channel, errorExchange, nackExchange, timeoutExchange, timeoutQueueNamePrefix, queueExpiration) {
  this.channel = channel;
  this.errorExchange = errorExchange;
  this.nackExchange = nackExchange;
  this.timeoutExchange = timeoutExchange;
  this.timeoutQueueNamePrefix = timeoutQueueNamePrefix;
  this.queueExpiration = queueExpiration;
}

/**
 * Publishes a message using through the opened channel
 * @param exchange
 * @param queue
 * @param msg
 * @param options
 */
Sender.prototype.publish = function (exchange, routingKey, msg, options) {
  return this.channel.publish(exchange, routingKey, msg, options);
};

/**
 * Publishes a message directly to the provided queue
 * @param exchange
 * @param queue
 * @param msg
 * @param options
 */
Sender.prototype.sendToQueue = function (queue, msg, options) {
  return this.channel.sendToQueue(queue, msg, options);
};

/**
 * Extracts an option object based on rabbit-task message format
 * @param msg
 * @returns {{}}
 */
Sender.prototype.buildOptionsFromMsg = function (msg, headers, fields) {
  headers = headers || {};
  fields = fields || {};
  var correlationId = msg.properties.messageId;
  if (!headers.topic) {
    if (!!msg.properties.headers) {
      headers.topic = msg.properties.headers.replyToTopic || msg.properties.headers.topic;
      headers.context = msg.properties.headers.context || {};
    }
    else {
      headers.topic = '';
      headers.context = {};
    }
  }

  // returns the options object based on rabbit-task format
  var options = _.extend({ correlationId: correlationId, messageId: correlationId, replyTo: msg.properties.replyTo }, fields);
  options.headers = headers;
  return options;
};

/**
 * Reports an error to the error queue
 * @param msg
 * @param reason
 */
Sender.prototype.error = function (msg, reason) {
  logger.info('[Sender] reports an error of a msg:' + msg.fields.consumerTag);
  this.publish(this.errorExchange, msg.fields.routingKey, msg.content, {
    headers: {
      error: reason
    }
  });
};

/**
 * Applicative nack,
 * verifies if the maximum attempts was reached, in case not publishes the message to the nack exchange.
 * the message would be acked anyway.
 * @param msg
 */
Sender.prototype.appNack = function (msg) {
  var attempts = msg.properties.headers['x-attempts-left'];
  attempts = attempts ? attempts - 1 : DEFAULT_MAX_ATTEMPTS - 1;

  var timeoutInterval = msg.properties.headers['time-out-interval'] ?
    msg.properties.headers['time-out-interval'] : DEFAULT_MESSAGE_TIMEOUT_INTERVAL;
  if (attempts > 0) {
    // message ttl is important because of 2 reasons:
    // 1) to make sure we can track the the message timeout
    // 2) for the routing in the timeout exchange.
    var options = this.buildOptionsFromMsg(msg, {
      'x-attempts-left': attempts,
      'message-ttl': timeoutInterval
    });
    //make sure we have the correct queue and bind it to the EXCHANGE
    var queueName = this.timeoutQueueNamePrefix + '.timeout.' + timeoutInterval;

    var self = this;
    this.channel.assertQueue(queueName, {
        deadLetterExchange: self.nackExchange,
        arguments: {
          'x-message-ttl': timeoutInterval,
          'x-expires': this.queueExpiration || DEFAULT_QUEUE_EXPIRATION
        }
      })
      .then(function () {
        // we do the routing on this exchange by header. so in this case all messages with the
        // same timeout will be routed to the same queue.
        return self.channel.bindQueue(queueName, self.timeoutExchange, '', {
          'x-match': 'any',
          'message-ttl': timeoutInterval
        })
      })
      .then(function () {
        return self.publish(self.timeoutExchange, msg.fields.routingKey, msg.content, options)
      });

  }
  return this.ack(msg);
};


/**
 * Send a response to to queue
 * @param {object} options - Metadata options for message.
 * @param {string} queueName - The name of the queue the response should be send to.
 * @param {string|number|[string]|[number]} response
 */
Sender.prototype.reply = function (response, queueName, options) {
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
Sender.prototype.ack = function (msg) {
  return this.channel.ack(msg);
}

/**
 * Nacks a message
 * @param msg
 * @returns {{deliveryTag, multiple, requeue}}
 */
Sender.prototype.nack = function (msg) {
  return this.channel.nack(msg);
}

module.exports = Sender;