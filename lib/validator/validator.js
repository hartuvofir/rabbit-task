/**
 * Created by asafdavid on 13/12/2015.
 */
var ValidationError = require('./validationError');

/**
 * Validate an object according to a Joi schema
 * Return a promise, resolve with the validate schema, reject with the error.
 * @param type - Joi schema
 * @param object - Object to validate
 * @returns {Promise}
 */
exports.validate = function(type, object) {
  return new Promise(function(resolve, reject) {
    type.validate(object, function(err, value) {
      if (err) {
        reject(new ValidationError(err));
      } else {
        resolve(value);
      }
    })
  });
};