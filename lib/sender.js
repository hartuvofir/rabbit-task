/**
 * Created by asafdavid on 10/12/2015.
 */
/**
 * Responsible for sending messages to the AMQP server
 * @param channel
 * @constructor
 */
function Sender(channel) {
  this.channel = channel;
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


module.exports = Sender;