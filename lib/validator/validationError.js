/**
 * Created by matan on 12/28/15.
 */
function ValidationError(message) {
  Error.call(message);
  this.message = message;
  this.name = this.constructor.name;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor.name);
  }
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

module.exports = ValidationError;