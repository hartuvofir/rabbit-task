/**
 * Created by meirshalev on 11/05/2017.
 */
import math from 'mathjs'; // eslint-disable-line import/no-extraneous-dependencies
import joi from 'joi';
import { BaseService, Decorator } from '../../../dist'; // eslint-disable-line import/named
import * as Errors from './errors';

const { Task, Joi } = Decorator;
const EVALUATE_TOPIC = 'RT.CALC.EVALUATE';

export default class CalculatorService extends BaseService {
  @Joi(joi.object().keys({
    expression: joi.string().required(),
  }))
  @Task({
    topic: EVALUATE_TOPIC,
    sync: true,
    errors: Errors,
  })
  evaluate({ expression }) {
    console.log(`received expression: ${expression}`);
    const result = math.eval(expression);
    console.log(`result: ${result}`);
    if (isNaN(result)) {
      return Promise.reject(new Errors.EvaluationError());
    }
    return Promise.resolve({ result });
  }
}
