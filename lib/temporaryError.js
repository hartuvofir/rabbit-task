/**
 * Created by matan on 12/29/15.
 */
var util = require('util');
/**
 * Represents a temporary error in the handler functionality, signaling that this task should be attempted later
 * @param message - error message
 * @constructor
 */
function TemporaryError(message) {
  Error.call(message);
  this.message = message;
  this.name = this.constructor.name;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor.name);
  }
}
util.inherits(TemporaryError, Error);

module.exports = TemporaryError;