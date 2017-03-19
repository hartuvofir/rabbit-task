/**
 * Created by matan on 12/28/15.
 * @extends Error
 */
export default class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}
