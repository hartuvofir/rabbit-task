/**
 * Created by meirshalev on 11/05/2017.
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

export class EvaluationError extends ExtendableError {
  constructor(message = 'Evaluation error') {
    super(message);
  }
}
