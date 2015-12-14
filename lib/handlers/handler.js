/**
 * Created by asafdavid on 09/12/2015.
 */
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
* Default msg handler - does nothing
* @param msg
*/
MsgHandler.prototype.doHandle = function(sender, msg) {
  return Promise.resolve(true);
};

/**
 * Abstact message handler, handles acks and nacks so each handler won't have to be aware of the channel.
 * @param msg
 */
MsgHandler.prototype.handle = function(sender, msg) {
  this.doHandle(sender, msg).then(function() {
    console.info('[MsgHandler] acks a msg with tag: ', msg.fields.consumerTag);
    sender.channel.ack(msg);
  }, function(err) {
    console.error('[MsgHandler] nacks a msg with tag: ', msg.fields.consumerTag);
    sender.channel.nack(msg);
  });
};

module.exports = MsgHandler;