/**
 * Created by asafdavid on 20/02/2017.
 */
import _ from 'lodash';

import BaseService from '../baseService';

/**
 * A method decorator to define a new task in a micro-service interface,
 * the decorator will add the right metadata to the
 * @param sync
 * @param description
 * @param topic
 * @returns {taskDecorator}
 */
export default function Task({ sync, description, topic }) {
  if (!topic || !_.isString(topic)) throw new TypeError('topic is required and must be a string');
  if (sync && !_.isBoolean(sync)) throw new TypeError('sync must be a boolean');
  if (description && !_.isString(description)) throw new TypeError('description must be a string');

  return function taskDecorator(target, key, descriptor) {
    // Check if a task is defined within a service
    if (!(target instanceof BaseService)) {
      throw SyntaxError('@task must be defined within a service');
    }
    if (!_.isFunction(descriptor.value)) throw SyntaxError('@task must be defined on a function');

    // Initializes the _tasks container
    if (!target._tasks) target._tasks = {};

    // Define the task metadata
    target._tasks[key] = {
      name: key,
      handler: descriptor.value,
      middleware: { pre: [], post: [] },
      options: {},
      sync,
      topic,
      description,
    };
  };
}
