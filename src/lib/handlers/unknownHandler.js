/**
 * Created by asafdavid on 09/12/2015.
 */

import MsgHandler from './handler';
import logger from '../logger';

/**
 * Unknown topic handler, used as BookMD's default handler
 */
export default class UnknownHandler extends MsgHandler {
  constructor() {
    super('unknownTopicHandler', '#');
  }

  /* eslint-disable class-methods-use-this */
  doHandle(msg) {
    logger.instance.info('[UnknownHandler] handles msg', { body: JSON.stringify(msg) });
    return Promise.reject(new Error(msg.content));
  }
  /* eslint-enable class-methods-use-this */
}
