/**
 * Created by matan on 12/29/15.
 */
import ExtendableError from './extendableError';

/**
 * Represents a temporary error in the handler functionality,
 * signaling that this task should be attempted later
 * @param message - error message
 * @constructor
 */
export default class TemporaryError extends ExtendableError {}
