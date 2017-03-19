/**
 * Created by meirshalev on 02/02/2017.
 */

const Worker = require('../../../dist').Worker;
const Connection = require('../../../dist').Connection;
const router = require('./router');
const Configuration = require('./configuration');
const constants = require('../constants');

const queueName = constants.queueName;
const conn = new Connection(process.env.RABBIT_URL);
const config = new Configuration(conn);
const worker = new Worker(
  'calculator-worker-worker',
  conn,
  queueName,
  router,
  () => config.configure(),
);

worker.start();
