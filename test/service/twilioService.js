/**
 * Created by asafdavid on 20/02/2017.
 */
import Promise from 'bluebird';

import { Task } from '../../src/service/decorator';
import BaseService from '../../src/service/baseService';

export default class TwilioService extends BaseService {
  constructor() {
    super('Twilio');
  }

  @Task({
    topic: 'TWILIO.SEND',
    sync: true,
  })
  sendSms({ number, text }) { // eslint-disable-line class-methods-use-this
    return Promise.resolve(`message sent ${text} to ${number}`);
  }

  @Task({
    topic: 'TWILIO.RECEIVE',
    sync: false,
  })
  receiveSms() { // eslint-disable-line class-methods-use-this
    return Promise.resolve('Received a message');
  }
}
