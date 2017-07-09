/**
 * Created by ofirHar on 04/07/2017.
 */
export class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FaxError extends ExtendableError {
  constructor(message = 'Fax error') {
    super(message);
  }
}
