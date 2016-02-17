/**
 * Created by asafdavid on 08/12/2015.
 */
var EventEmitter = require("events").EventEmitter;
var util = require("util");

function Listener(channel, queue) {
  EventEmitter.call(this);
  this.channel = channel;
  this.queue = queue;
}
util.inherits(Listener, EventEmitter);

/**
 * Start consuming messages
 */
Listener.prototype.start = function () {
  console.log('[AMQP] Listener starts');
  var that = this;
  this.channel.consume(this.queue, this.processMsg.bind(this), {noAck: false}).then(function (fields) {
    that.consumerTag = fields.consumerTag;
  });
};

/**
 * Processes the next msg
 * @param msg
 */
Listener.prototype.processMsg = function (msg) {
  console.info("[AMQP] received a msg ", msg.fields.consumerTag);
  this.emit('msg', msg);
};

/**
 * Stops consuming messages
 */
Listener.prototype.stop = function () {
  if (this.consumerTag) {
    console.info('[AMQP] Listener stops listening to consumer tag ' + this.consumerTag);
    this.channel.cancel(this.consumerTag);
  }
};

module.exports = Listener;