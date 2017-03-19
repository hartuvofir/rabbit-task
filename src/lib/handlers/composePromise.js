/**
 * Created by asafdavid on 09/03/2017.
 */
import Promise from 'bluebird';

/**
 * Composes single-argument functions that return promises from right to left.
 * Heavily inspired by Redux.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => h(...args).then(...args => f()).then(...args => g(...args)).
 */

export default function composePromise(...funcs) {
  // Return a method that returns the message
  if (funcs.length === 0) {
    return arg => Promise.resolve(arg);
  }

  // One middleware - return as is
  if (funcs.length === 1) {
    return funcs[0];
  }

  // Compose middleware
  return funcs.reduce((a, b) => (...args) => b(...args).then((...response) => a(...response)));
}
