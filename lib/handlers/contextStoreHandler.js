/**
 * Created by rom on 15/03/2016.
 */

var _ = require('lodash');
var util = require('util');
var validate = require('../validator');

var JsonSchemaHandler = require('./jsonSchemaHandler');

/**
 * Inherits from JsonSchemaHandler (that inherits from MsgHandler)
 * Add the context directly to the doHandle method
 * The doHandle method will received an object with two keys:
 * 1. content - the validated parsed json data
 * 2. context - the context that sent from the client
 *
 * @param name
 * @param pattern
 * @constructor
 */
function ContextStoreHandler(name, pattern, options) {
  JsonSchemaHandler.call(this, name, pattern, options);
}

util.inherits(ContextStoreHandler, JsonSchemaHandler);

/**
 * Override the preHandle method of JsonSchemaHandler
 * Transfer the context to the
 * @param msg
 * @returns {*}
 */
ContextStoreHandler.prototype.preHandle = function (msg) {
  var that = this;

  return Promise.resolve(msg)
    // Parse JSON
    .then(msg => {
      var headers = msg.properties.headers;
      var context = headers.context;
      return that.parseJson(msg)
      .then(content => {
        return Promise.resolve({ content, context, headers });
      })
    })
    // Validate message
    .then(function (msg) {
      return validate(that.options.schema, msg.content)
      .then(validatedMsg => {
        return Promise.resolve({ content: validatedMsg, context: msg.context, headers: msg.headers});
      })
    });
};

module.exports = ContextStoreHandler;
