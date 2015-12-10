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
  this.channel.consume(this.queue, this.processMsg.bind(this), {noAck: false});
};


/**
 * Processes the next msg
 * @param msg
 */
Listener.prototype.processMsg = function (msg) {
  console.info("[AMQP] received a msg ", msg.fields.consumerTag);
  this.emit('msg', msg);
};

module.exports = Listener;