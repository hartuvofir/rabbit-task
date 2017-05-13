/**
 * Created by meirshalev on 05/02/2017.
 */
const constants = require('../constants');

const EXCHANGE_NAME = constants.exchangeName;
const QUEUE_NAME = constants.queueName;

/**
 * This class is responsible for setting up Rabbit for this example,
 * which includes creating a dedicated exchange, a queue and binding them together (fanout).
 * @param conn rabbit-task connection
 * @constructor
 */
function Configuration(conn) {
  this.conn = conn;
}

Configuration.prototype.configure =
  () => this.configExchanges()
    .then(this.configQueues.bind(this))
    .then(this.configBindings.bind(this))
    .then(() => console.log('configured Rabbit'));

Configuration.prototype.configExchanges =
  () => this.conn.channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

Configuration.prototype.configQueues =
  () => this.conn.channel.assertQueue(QUEUE_NAME, { durable: true });


Configuration.prototype.configBindings =
  () => this.conn.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME);

module.exports = Configuration;
