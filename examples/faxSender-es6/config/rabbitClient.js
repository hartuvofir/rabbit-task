/**
 * Created by ofirHar on 04/07/2017.
 */
import { Client } from '../../../dist'; // eslint-disable-line import/named
import Constants from './constants';

const RabbitClient = new Client(
  Constants.queueName,
  process.env.RABBIT_CONSUMER_TAG,
  'amqp://ggrrwcto:Y9H4-REntNlqY3ImbcmIBV4PiBqrMSRp@orangutan.rmq.cloudamqp.com/ggrrwcto'
); // Setup a new rabbit-task client.

export default RabbitClient;
