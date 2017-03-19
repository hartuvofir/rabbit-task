/**
 * Created by asafdavid on 01/03/2017.
 */
import Promise from 'bluebird';
import _ from 'lodash';

import BaseService from '../baseService';

export const NOOP = res => Promise.resolve(res);

/**
 * Creates a Middleware decorator
 * @param pre
 * @param post
 * @constructor
 */
export default function Middleware(name, pre = NOOP, post = NOOP, options = {}) {
  if (!name) throw new TypeError('name is required');
  if (!_.isFunction(pre)) throw new TypeError('pre is required and must be a function');
  if (!_.isFunction(post)) throw new TypeError('post is required and must be a function');

  return function middlewareDecorator(target, key, descriptor) {
    // Check if a task is defined within a service
    if (!(target instanceof BaseService)) {
      throw SyntaxError('@task must be defined within a service');
    }
    if (!_.isFunction(descriptor.value)) {
      throw SyntaxError(`@Middleware(${name}) must be defined on a function`);
    }
    // Check if it was defined on a task
    if (!target._tasks || !target._tasks[key]) {
      throw SyntaxError(
        `@Middleware(${name}) must be defined on a task, use @Task before @Middleware`
      );
    }

    // Add the middleware by order
    target._tasks[key].middleware.pre.push(pre);
    target._tasks[key].middleware.post.push(post);
    target._tasks[key].options[name] = options;
  };
}
