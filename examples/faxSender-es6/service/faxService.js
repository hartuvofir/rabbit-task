/**
 * Created by ofirHar on 04/07/2017.
 */
import joi from 'joi';
import { BaseService, Decorator } from '../../../dist'; // eslint-disable-line import/named
import * as Errors from './errors';
import FaxAPI from './faxAPI';
import Promise from 'bluebird';

const { Task, Joi } = Decorator;
const FAX_TOPIC = 'RT.FAX.EVALUATE';

export default class FaxService extends BaseService {
  @Joi(joi.object().keys({
      faxData: joi.string().required(),
  }))
  @Task({
    topic: FAX_TOPIC,
    sync: true,
    errors: Errors,
  })
  fax({ faxData }) {
    console.log(`received Fax : ${faxData}`);
    let sentTime = Date.now();
    FaxAPI.sendFax(faxData,sentTime,(result)=>{
        FaxService.pullEmitter.emit('finish');

        if (result instanceof Errors.FaxError)
            return Promise.reject(result);

        return Promise.resolve(result);
    });
  }


  static registerPull(pullEmitter){
      FaxService.pullEmitter =  pullEmitter;
  }
}
