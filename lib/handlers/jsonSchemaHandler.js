/**
 * Created by rom on 01/14/2016.
 */
var _ = require('lodash');
var util = require('util');
var validate = require('../validator');

var MsgHandler = require('./handler');

/**
 * Inherits from MsgHandler
 * Take care of parsing the JSON message, and validate it with the schema given in the options parameter
 *
 * @param name
 * @param pattern
 * @param options {
 *  schema: <Joi schema object>
 * }
 * @constructor
 */
function JsonSchemaHandler(name, pattern, options) {
  // Validate that there is a Joi schema in options object
  if (!options || !options.schema || !options.schema.isJoi)
    throw new Error("Joi schema is expected in options object");

  this.options = options;
  MsgHandler.call(this, name, pattern);
}

util.inherits(JsonSchemaHandler, MsgHandler);

/**
 * Pre handle, get the message, parse the JSON and verify the schema
 * @param msg
 * @returns {Promise.<*>}
 */
JsonSchemaHandler.prototype.preHandle = function (msg) {
  var that = this;

  return Promise.resolve(msg)
    // Parse JSON
    .then(that.parseJson)
    // Validate message
    .then(function (parsedMessage) {
      return validate(that.options.schema, parsedMessage);
    });
};

/**
 * Post handle, get the result message from the API, and manipulate it
 * If got response without errors, stringify it and pass it to handle function
 * If got error, reject the message with the error
 * @param msg
 * @returns {Promise.<*>}
 */
JsonSchemaHandler.prototype.postHandle = function (msg) {
  var that = this;

  return Promise.resolve(msg)
    // If success
    .then(function (response) {
      // Send a response back
      console.info('[%s] received a response %s', that.name, response);
      return JSON.stringify(response);
    })
    // If failed
    .catch(function (err) {
      console.error('[%s] could not send the request, received an error %s', that.name, err);
      err.message = 'could not send the request';

      return Promise.reject(err);
    });
};

module.exports = JsonSchemaHandler;