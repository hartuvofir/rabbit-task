/**
 * Created by asafdavid on 13/03/2017.
 */
import { RabbitService } from '../../../dist'; // eslint-disable-line import/named
import GeoService from '../service/geoService';
import RabbitClient from '../config/rabbitClient';
import Constants from '../config/constants';

/**
 * @type GeoService
 */
const service = RabbitService.getClient(
  GeoService,
  RabbitClient,
  { serverExchangeName: Constants.exchangeName }
);
export default service;
