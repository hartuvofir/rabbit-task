/**
 * Created by meirshalev on 02/02/2017.
 */
import { Worker, Connection, RabbitService,PullSyncer } from '../../../dist'; // eslint-disable-line import/named
import router from './router';
import { EventEmitter }from 'events';
import configure from './configuration';
import Constants from '../config/constants';
import syncDBCredentials from '../config/dbCredentials';
import FaxService from '../service/faxService';
import FaxAPI from '../service/faxAPI';

// Init Communication
//const conn = new Connection(process.env.RABBIT_URL);
const conn = new Connection('amqp://ggrrwcto:Y9H4-REntNlqY3ImbcmIBV4PiBqrMSRp@orangutan.rmq.cloudamqp.com/ggrrwcto');

// Init pulling settings
let sendInterval = 5000;
let pullEmitter= new EventEmitter();
let pullSyncer = new PullSyncer(sendInterval,pullEmitter,syncDBCredentials);
FaxService.registerPull(pullEmitter);

// Register services
RabbitService.register(router, FaxService);
FaxAPI.init(sendInterval,syncDBCredentials);

// Start the worker
const worker = new Worker(
  'fax-worker-worker',
  conn,
  Constants.queueName,
  router,
  () => configure(conn),
  pullEmitter,
);

worker.start();
