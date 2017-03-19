/**
 * Created by asafdavid on 08/12/2015.
 */
import { EventEmitter } from 'events';
import _ from 'lodash';
import Chance from 'chance';
import logger from './logger';

const chance = new Chance();

export default class Listener extends EventEmitter {
  constructor(channel, queue, consumerTag) {
    super();
    this.channel = channel;
    this.queue = queue;
    this.consumerTag = consumerTag;
  }

  /**
   * Start consuming messages
   */
  start() {
    logger.instance.log('[AMQP] Listener starts');
    let options = { noAck: false };
    const hasConsumerTag = !!this.consumerTag;
    options = hasConsumerTag ?
      _.extend(options, { consumerTag: `${this.consumerTag}-${chance.hash({ length: 5 })}` }) :
      options;
    this.channel.consume(
      this.queue,
      msg => this.processMsg(msg),
      options,
    ).then((fields) => {
      this.consumerTag = fields.consumerTag;
    });
  }

  /**
   * Processes the next msg
   * @param msg
   */
  processMsg(msg) {
    if (msg) {
      logger.instance.info(`[AMQP] received a msg in ${msg.fields.consumerTag}`);
      this.emit('msg', msg);
    }
  }

  /**
   * Stops consuming messages
   */
  stop() {
    if (this.consumerTag) {
      logger.instance.info(`[AMQP] Listener stops listening to consumer tag ${this.consumerTag}`);
      this.channel.cancel(this.consumerTag);
    }
  }
}
