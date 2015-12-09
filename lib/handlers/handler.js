/**
 * Created by asafdavid on 09/12/2015.
 */
var Conn = require('../connection');

function MsgHandler(name, pattern) {
  this.name = name;
  this.pattern = pattern;
}

/**
 * Validates if the wanted pattern match the provided handler msg
 * @param routingKey
 */
MsgHandler.prototype.match = function(routingKey) {
  return (this.pattern === routingKey);
};

/**
 * Default msg handler ack and do nothing
 * @param msg
 */
MsgHandler.prototype.handle = function(msg) {
  Conn.channel.ack(msg);
};

module.exports = MsgHandler;