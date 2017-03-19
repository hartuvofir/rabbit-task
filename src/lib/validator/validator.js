/**
 * Created by asafdavid on 13/12/2015.
 */
import Promise from 'bluebird';

import ValidationError from '../error/validationError';

/**
 * Validate an object according to a Joi schema
 * Return a promise, resolve with the validate schema, reject with the error.
 * @param type - Joi schema
 * @param object - Object to validate
 * @returns {Promise}
 */
export default function validate(type, object) {
  return new Promise((resolve, reject) => {
    type.validate(object, (err, value) => {
      if (err) {
        reject(new ValidationError(err));
      } else {
        resolve(value);
      }
    });
  });
}
