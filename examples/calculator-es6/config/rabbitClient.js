/**
 * Created by asafdavid on 13/03/2017.
 */
import { Client } from '../../../dist'; // eslint-disable-line import/named
import Constants from './constants';

const RabbitClient = new Client(
  Constants.queueName,
  process.env.RABBIT_CONSUMER_TAG,
); // Setup a new rabbit-task client.

export default RabbitClient;
