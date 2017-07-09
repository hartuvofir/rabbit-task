/**
 * Created by ofirHar on 04/07/2017.
 */
import { RabbitService } from '../../../dist'; // eslint-disable-line import/named
import FaxService from '../service/faxService';
import RabbitClient from '../config/rabbitClient';
import Constants from '../config/constants';

/**
 * @type GeoService
 */
const service = RabbitService.getClient(
  FaxService,
  RabbitClient,
  { serverExchangeName: Constants.exchangeName }
);
export default service;
