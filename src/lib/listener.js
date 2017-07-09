/**
 * Created by asafdavid on 08/12/2015.
 */
import { EventEmitter } from 'events';
import _ from 'lodash';
import Chance from 'chance';
import logger from './logger';

const chance = new Chance();

export default class Listener extends EventEmitter {
    constructor(channel, queue, consumerTag,pullingEmitter = undefined) {
        super();
        this.channel = channel;
        this.queue = queue;
        this.consumerTag = consumerTag;
        this.pullingEmitter = pullingEmitter || undefined;
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

      if(!this.pullingEmitter) {
          logger.instance.log('[AMQP] Listener starts in *Push* mode');
          this.channel.consume(this.queue,msg => this.processMsg(msg),options,)
              .then((fields) => {
                  this.consumerTag = fields.consumerTag;
              });
      }
      else{
          logger.instance.log('[AMQP] Listener starts in *Pull* mode');
          this.pullingEmitter.on('pull',()=>{
              this.channel.get(this.queue,{ noAck: false }).then((msg) => {
                  if(msg !== false){ // false means that there's no messages to pull in the queue
                      this.processMsg(msg);
                  }
                  else{
                      this.pullingEmitter.emit('finish');
                  }
              });
          });

          this.pullingEmitter.emit('start'); // notify the pullSyncer to start a synchrony pull mode
      }
  }

  /**
   * Processes the next msg
   * @param msg
   */
  processMsg(msg) {
    if (msg) {
        if(msg.fields && msg.fields.consumerTag) // relevant only for push mode
          logger.instance.info(`[AMQP] received a msg in ${msg.fields.consumerTag} , queue: ${this.queue}`);

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
