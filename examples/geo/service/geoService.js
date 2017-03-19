/**
 * Created by asafdavid on 13/03/2017.
 */
import NodeGeocoder from 'node-geocoder'; // eslint-disable-line import/no-extraneous-dependencies
import _ from 'lodash';

import AddressSchema from './addressSchema';
import { BaseService, Decorator } from '../../../dist'; // eslint-disable-line import/named

const { Task, Joi } = Decorator;
const ENCODE_TOPIC = 'RT.GEO.ENCODE';

const geocoder = NodeGeocoder({
  provider: 'google',
});

export default class GeoService extends BaseService {
  @Joi(AddressSchema)
  @Task({
    topic: ENCODE_TOPIC,
    sync: true,
  })
  encode({ address }) {
    return geocoder.geocode(address)
      .then((res) => {
        if (!_.isArray(res) || res.length === 0) {
          throw new Error(`${address} could not be geo coded`);
        }

        let response = res[0];
        response = _.pick(response, ['formattedAddress', 'latitude', 'longitude']);
        return response;
      })
      .tap(res => console.log('[GeoService] res:', res));
  }
}
