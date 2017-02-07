/**
 * Created by meirshalev on 05/02/2017.
 */

var constants = require('../constants');

var EXCHANGE_NAME = constants.exchangeName;
var QUEUE_NAME = constants.queueName;

/**
 * This class is responsible for setting up Rabbit for this example,
 * which includes creating a dedicated exchange, a queue and binding them together (fanout).
 * @param conn rabbit-task connection
 * @constructor
 */
function Configuration(conn) {
  this.conn = conn;
}

Configuration.prototype.configure = function() {
  return this.configExchanges()
  .then(this.configQueues.bind(this))
  .then(this.configBindings.bind(this)).then(function() { console.log('configured Rabbit') } );

};

Configuration.prototype.configExchanges = function() {
  return this.conn.channel.assertExchange(
    EXCHANGE_NAME,
    'fanout',
    { durable: true });
};

Configuration.prototype.configQueues = function() {

  return this.conn.channel.assertQueue(QUEUE_NAME, {
    durable: true
  });
};


Configuration.prototype.configBindings = function() {
  return this.conn.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME);
};

module.exports = Configuration;