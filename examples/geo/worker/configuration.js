/**
 * Created by meirshalev on 05/02/2017.
 */
import Constants from '../config/constants';

function configExchanges(conn) {
  return conn.channel.assertExchange(
    Constants.exchangeName,
    'fanout',
    { durable: true },
  );
}

function configQueues(conn) {
  return conn.channel.assertQueue(Constants.queueName, {
    durable: true,
  });
}

function configBindings(conn) {
  return conn.channel.bindQueue(Constants.queueName, Constants.exchangeName);
}

export default function configure(conn) {
  return configExchanges(conn)
    .then(() => configQueues(conn))
    .then(() => configBindings(conn))
    .tap(() => console.log('configured Rabbit'));
}
