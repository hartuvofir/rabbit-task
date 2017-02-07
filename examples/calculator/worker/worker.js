/**
 * Created by meirshalev on 02/02/2017.
 */

var Worker = require('../../../lib/worker');
var Connection = require('../../../lib/connection');
var router = require('./router');
var Configuration = require('./configuration');
var constants = require('../constants');

var queueName = constants.queueName;
var conn = new Connection(process.env.RABBIT_URL);
var config = new Configuration(conn);
var worker = new Worker(
  'calculator-worker-worker',
  conn,
  queueName,
  router,
  function() { return config.configure() }
);

worker.start();