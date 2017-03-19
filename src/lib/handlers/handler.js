/**
 * Created by asafdavid on 09/12/2015.
 */
import _ from 'lodash';
import Promise from 'bluebird';

import logger from '../logger';
import TemporaryError from '../error/temporaryError';
import HandlerResponse from './handlerResponse';
import composePromise from './composePromise';

export default class MsgHandler {
  constructor(name, pattern, middleware = { pre: [], post: [] }, options = {}) {
    this.name = name;
    this.pattern = pattern;
    this.middleware = middleware;
    this.options = options;
  }

  /**
   * Validates if the wanted pattern match the provided handler msg
   * There are 4 options:
   * 1. Array of topics
   * 2. RegEx pattern
   * 3. Object where the keys are the topics
   * @param topic
   */
  match(topic) {
    // If array, check if the topic is inside the array
    if (_.isArray(this.pattern)) {
      return (this.pattern.indexOf(topic) > -1);
    }

    // If RegEx check the match
    if (_.isRegExp(this.pattern)) {
      return (topic.match(this.pattern) != null);
    }

    // If object, check if the topic is part of the object
    if (_.isObject(this.pattern)) {
      return Object.prototype.hasOwnProperty.call(this.pattern, topic);
    }

    // Else, pattern is a string
    return (this.pattern === topic);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Default msg handler - does nothing
   * @param msg
   */
  doHandle(msg) {
    return Promise.resolve(msg);
  }

  /* eslint-enable class-methods-use-this */

  /**
   * Handle the reply to a queue and ack the message
   * Handles response if it is HandlerResponse,
   * acceptable sending type (string/number/[string]/[number]) or a general object to stringify.
   * @param sender - sender object
   * @param msg - the original message to response to
   * @param res - string or handlerResponse
   * @param headers - headers to append to to response
   * @returns {*}
   */
  reply(sender, msg, res, headers) {
    if (!!res && this.shouldReply(msg, res)) {
      logger.instance.info(`[MsgHandler] replies to a msg with tag: ${msg.fields.consumerTag}`);
      try {
        if (!(res instanceof HandlerResponse)) {
          // if acceptable type use res as body, otherwise stringify
          const body = (_.isString(res) || _.isNumber(res)) ?
            res :
            JSON.stringify(res);
          res = new HandlerResponse(body, msg, headers);
        }

        // Send a reply
        sender.reply(res);
      } catch (e) {
        logger.instance.error(
          '[MsgHandler] an unexpected error has while attempting to reply to the msg with tag:' +
          `${msg.fields.consumerTag}
           Error was ${e.stack || e.toString()}
           response was: ${res.messageBody || res}`
        );
        return Promise.reject(e);
      }
    }
    logger.instance.info('[MsgHandler] acks a msg with tag: ', msg.fields.consumerTag);
    const ack = sender.ack(msg.raw);
    return Promise.resolve(ack);
  }

  /**
   * Abstract message handler, handles acks and nacks so each handler won't have to be aware of the
   * channel. This function have two hooks: preHandle - before doHandle function, and postHandle -
   * after doHandle function
   * @param sender
   * @param msg
   * @param promise
   * @returns {Promise.<T>}
   */
  handle(sender, msg) {
    // Bind middleware to this handler
    const pre = this.middleware.pre.map(func => func.bind(this));
    const post = this.middleware.post.map(func => func.bind(this));

    // Add pre and post middleware to the handler
    const handler = composePromise(
      ...(post.reverse()),
      this.doHandle.bind(this),
      ...pre
    );

    return handler(msg)
      .tap(res => this.reply(sender, msg, res))
      .catch((err) => {
        logger.instance.error(
          `[MsgHandler] received the following error from handler: ${err.stack}` || err
        );
        // If error is NOT of the temporary type, reply as error,
        // otherwise reinsert it back to the message queue or if the TemporaryError has
        // no retries left
        if (!(err instanceof TemporaryError) || msg.headers['x-attempts-left'] <= 1) {
          this.reply(sender, msg, err, { isError: true });
        } else if (sender.nackExchange) {
          logger.instance.error('[MsgHandler] app-nacks a msg with tag: ', msg.fields.consumerTag);
          sender.appNack(msg);
        } else {
          logger.instance.error('[MsgHandler] nacks a msg with tag: ', msg.fields.consumerTag);
          sender.nack(msg);
        }
        return Promise.reject(err);
      });
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Checks if a response should be sent back as a reply to a reply queue
   * @param originalMessage - the original message to response to
   * @param response - the response for the original message
   * @returns {boolean}
   */
  shouldReply(originalMessage, response) {
    if (response instanceof HandlerResponse) {
      return !!response.replyTo;
    }
    return !!originalMessage.properties.replyTo;
  }
  /* eslint-enable class-methods-use-this */
}
