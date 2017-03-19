/**
 * Created by asafdavid on 10/03/2017.
 */
import Promise from 'bluebird';
import validate from '../validator/validator';

export function pre(msg) {
  return Promise.resolve(msg)
    // Validate message
    .then(msg => validate(this.options.joi.schema, msg.content))
    .then(() => msg);
}

export function post(res) {
  return Promise.resolve(res);
}
