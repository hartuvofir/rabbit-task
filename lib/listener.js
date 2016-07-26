/**
 * Created by asafdavid on 08/12/2015.
 */
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var _ = require('lodash');
var Chance = require('chance');
var logger = require('./logger');

var chance = new Chance();

function Listener(channel, queue, consumerTag) {
  EventEmitter.call(this);
  this.channel = channel;
  this.queue = queue;
  this.consumerTag = consumerTag;
}
util.inherits(Listener, EventEmitter);

/**
 * Start consuming messages
 */
Listener.prototype.start = function () {
  logger.instance.log('[AMQP] Listener starts');
  var that = this;
  var options = { noAck: false };
  options = !!this.consumerTag ? _.extend(options, { consumerTag: this.consumerTag + '-' + chance.hash({length: 5}) }) : options;
  this.channel.consume(this.queue, this.processMsg.bind(this), options).then(function (fields) {
    that.consumerTag = fields.consumerTag;
  });
};

/**
 * Processes the next msg
 * @param msg
 */
Listener.prototype.processMsg = function (msg) {
  if (msg) {
    logger.instance.info("[AMQP] received a msg in ", msg.fields.consumerTag);
    this.emit('msg', msg);
  }
};

/**
 * Stops consuming messages
 */
Listener.prototype.stop = function () {
  if (this.consumerTag) {
    logger.instance.info('[AMQP] Listener stops listening to consumer tag ' + this.consumerTag);
    this.channel.cancel(this.consumerTag);
  }
};

module.exports = Listener;