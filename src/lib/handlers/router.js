/**
 * Created by asafdavid on 08/12/2015.
 */
import _ from 'lodash';
import Promise from 'bluebird';

import MsgHandler from './handler';
import Message from './message';
import logger from '../logger';

export default class HandlerRouter {
  /**
   * This class is responsible for invoking the right handler for the provided msg based on its
   * routing key.
   * @param () - use arguments variable to get all the arguments
   * @constructor
   */
  constructor(handlers = []) {
    this.handlers = [];
    if (handlers) this.addRoutes(handlers);
  }

  /**
   * Add routes to the wanted router
   * @param handlers
   */
  addRoutes(handlers) {
    // Validate handlers parameter
    if (!_.isArray(handlers)) handlers = [handlers];

    // Initiate a new handler per type unless already received an instance of a MsgHandler
    handlers.forEach((handler, i) => {
      // validate each handler
      if (!(handler instanceof MsgHandler)) {
        if (!_.isObject(handler)) throw new Error('Invalid handler', handler);
        if (!handler.name || !handler.pattern || !handler.handle) {
          throw new Error('Invalid handler, must contain name, pattern and handler');
        } else {
          const BaseHandler = handler.base ? handler.base : MsgHandler;
          const middleware = handler.middleware || undefined;
          const options = handler.options ? handler.options : {};

          const newHandlerInstance = new BaseHandler(
            handler.name,
            handler.pattern,
            middleware,
            options
          );
          handlers[i] = newHandlerInstance;
          newHandlerInstance.doHandle = handler.handle;
        }
      }
    });

    // Initializes data members
    this.handlers = this.handlers.concat(handlers);
  }

  /**
   * Set the default handler
   * @param defaultHandler
   */
  setDefaultHandler(defaultHandler) {
    // // Validate the defaultHandler
    if (!!defaultHandler && !(defaultHandler instanceof MsgHandler)) {
      throw new Error('Invalid argument, defaultHandler must be an instance of MsgHandler');
    }

    this.defaultHandler = defaultHandler;
  }

  /* eslint-disable class-methods-use-this, no-unused-vars */
  /**
   * Function to run before the handler handle the message
   * Good for logs
   * @param sender
   * @param msg
   * @returns {Promise.<T>}
   */
  preRoute(sender, msg) {
    return Promise.resolve();
  }
  /* eslint-enable class-methods-use-this, no-unused-vars */

  /* eslint-disable class-methods-use-this, no-unused-vars */
  /**
   * Function to run after the handler handle the message
   * Good for logs
   * @param msg
   * @param res
   * @param err
   * @returns {Promise.<T>}
   */
  postRoute(msg, res, err) {
    return Promise.resolve();
  }
  /* eslint-enable class-methods-use-this, no-unused-vars */


  /**
   * Finds the handler that should handle the provided msg,
   * in case no suitable handler was found, invoke the default handler.
   * @param sender
   * @param rawMsg
   * @returns {Promise.<Message>}
   */
  route(sender, rawMsg) {
    const msg = new Message(rawMsg);
    return this.preRoute(sender, msg)
      .then(() => {
        let handlePromise;
        logger.instance.info('[HandlerRouter] routes a message with tag: ' +
          `${msg.fields.consumerTag} routing key: ${msg.topic}`);
        const wasFound = this.handlers.some((handler) => {
          if (handler.match(msg.topic)) {
            logger.instance.info(`[HandlerRouter] a handler was found: ${handler.name}`);
            handlePromise = handler.handle(sender, msg)
              .then(res => this.postRoute(msg, res, null))
              .catch(err => this.postRoute(msg, null, err));
            return true;
          }
          return false;
        });

        if (!!this.defaultHandler && !wasFound) {
          logger.instance.info('[HandlerRouter] no suitable was found, using default');
          handlePromise = this.defaultHandler.handle(sender, msg)
            .then(() => this.postRoute(msg, null, new Error('Not Found')));
        }

        return handlePromise;
      })
      .catch((e) => {
        logger.instance.info(
          '[HandlerRouter] an error has occurred during routing',
          { error: e }
        );
      });
  }
}
