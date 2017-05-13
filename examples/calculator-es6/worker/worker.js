/**
 * Created by meirshalev on 02/02/2017.
 */
import { Worker, Connection, RabbitService } from '../../../dist'; // eslint-disable-line import/named
import router from './router';
import configure from './configuration';
import Constants from '../config/constants';
import CalcService from '../service/calculatorService';

// Register services
RabbitService.register(router, CalcService);

// Start the worker
const conn = new Connection(process.env.RABBIT_URL);
const worker = new Worker(
  'calculator-worker-worker',
  conn,
  Constants.queueName,
  router,
  () => configure(conn),
);

worker.start();
