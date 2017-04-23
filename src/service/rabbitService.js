/**
 * Created by asafdavid on 23/02/2017.
 */
import _ from 'lodash';
import Promise from 'bluebird';

import Logger from '../lib/logger';
import Router from '../lib/handlers/router';
import BaseService from './baseService';
import Client from '../lib/client';

const Log = Logger.instance;

export default class RabbitService {
  /**
   * Registers a service to a router
   * @param router
   * @param service
   */
  static register(router, service, tasks = []) {
    // Verify parameters
    if (!(router && router instanceof Router)) {
      throw new TypeError('router has to be an instance of Router');
    }
    if (!(service &&
      (service instanceof BaseService || service.prototype instanceof BaseService))) {
      throw new TypeError('service has to be an instance of BaseService');
    }

    // Extract handlers
    const handlers = RabbitService._getTasks(service, tasks);
    router.addRoutes(RabbitService.toRabbitHandlers(handlers));
  }

  /**
   * Placeholder to convert handlers to rabbit syntax
   * @param handlers {Object}
   * @returns {*}
   */
  static toRabbitHandlers(tasks) {
    const handlers = [];
    _.each(tasks, (task) => {
      const { name, topic, handler, middleware, options } = task;

      handlers.push({
        name,
        pattern: topic,
        middleware,
        handle: ({ content }) => handler(content),
        options,
      });
    });

    return handlers;
  }

  /**
   * Returns a client to execute the the service's tasks.
   * @param service
   * @param client
   * @param serverMeta
   * @param tasks
   */
  static getClient(service, client, serverMeta, tasks = []) {
    // Validation
    if (!(service &&
      (service instanceof BaseService || service.prototype instanceof BaseService))) {
      throw new TypeError('service has to be an instance of BaseService');
    }
    if (!(client instanceof Client)) throw new TypeError('client must be an instance of Client');

    if (!(serverMeta && (serverMeta.serverExchangeName || serverMeta.serverQueueName))) {
      throw new TypeError('wrong serverMeta was provided');
    }

    // Build the client object
    const serviceName = service.prototype.constructor.name;
    const wantedTasks = RabbitService._getTasks(service, tasks);
    const clientInterface = {};
    _.each(wantedTasks, (task) => {
      const { name, topic, sync } = task;

      clientInterface[name] = sync ? function interfaceSendSync(msg, meta) {
        return RabbitService.sendSync(
          serviceName,
          name,
          client,
          serverMeta,
          topic,
          msg,
          meta
        );
      } : function interfaceSendAsync(msg, meta, context) {
        return RabbitService.sendAsync(
          serviceName,
          name,
          client,
          serverMeta,
          topic,
          msg,
          meta,
          context,
        );
      };
    });

    return clientInterface;
  }

  /**
   * Returns all of the tasks for a specific service
   * @param service
   * @param tasks
   * @returns {*}
   * @private
   */
  static _getTasks(service, tasks) {
    const allTasks = service._tasks || service.prototype._tasks;
    return tasks && !_.isEmpty(tasks) ? _.pick(allTasks, tasks) : allTasks;
  }

  /**
   * Executes an async task
   * @param serviceName
   * @param taskName
   * @param client
   * @param serverMeta
   * @param topicName
   * @param data
   * @param context
   * @returns {Promise.<T>}
   */
  static sendAsync(serviceName, taskName, client, serverMeta, topicName, data, meta, context) {
    return client.sendAsync(serverMeta, topicName, data, meta, context)
      .catch(() => {
        const error = `could not send message to ${topicName}`;
        Log.error(`[${serviceName}/${taskName}] - ${error}`);
        return Promise.reject(new Error(error));
      });
  }

  /**
   * Executes a sync task
   * @param serviceName
   * @param taskName
   * @param client
   * @param serverMeta
   * @param topicName
   * @param data
   * @returns {Promise.<T>}
   */
  static sendSync(serviceName, taskName, client, serverMeta, topicName, data, meta) {
    return client.sendSync(serverMeta, topicName, data, meta)
      .then(result => result && JSON.parse(result.content.toString()))
      .catch((error) => {
        error = error.content ? error.content.toString() : error.toString();
        Log.error(`[${serviceName}/${taskName}] - error for topic ${topicName}: ${error}`);
        return Promise.reject(new Error(error));
      });
  }
}
