/**
 * Created by asafdavid on 10/12/2015.
 */
import logger from './logger';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_MESSAGE_TIMEOUT_INTERVAL = 5000;
const DEFAULT_QUEUE_EXPIRATION = 90000;

/**
 * Responsible for sending messages to the AMQP server
 */
export default class Sender {
  /**
   * Creates a new sender
   * @param channel
   * @param errorExchange
   * @param nackExchange
   * @param timeoutExchange
   * @param timeoutQueueNamePrefix
   * @param queueExpiration
   */
  constructor(
    channel,
    errorExchange,
    nackExchange,
    timeoutExchange,
    timeoutQueueNamePrefix,
    queueExpiration
  ) {
    this.channel = channel;
    this.errorExchange = errorExchange;
    this.nackExchange = nackExchange;
    this.timeoutExchange = timeoutExchange;
    this.timeoutQueueNamePrefix = timeoutQueueNamePrefix;
    this.queueExpiration = queueExpiration;
  }

  /**
   * Publishes a message using through the opened channel
   * @param exchange
   * @param queue
   * @param content
   * @param options
   */
  publish(exchange, routingKey, content, options) {
    return this.channel.publish(exchange, routingKey, content, options);
  }

  /**
   * Publishes a message directly to the provided queue
   * @param exchange
   * @param queue
   * @param content
   * @param options
   */
  sendToQueue(queue, content, options) {
    return this.channel.sendToQueue(queue, content, options);
  }

  /**
   * Extracts an option object based on rabbit-task message format
   * @param {Message} msg
   * @param {Object} options
   * @returns {{}}
   */
  static buildOptionsFromMsg(msg, options) {
    return msg.toRabbitOptions(options);
  }


  /**
   * Reports an error to the error queue
   * @param msg
   * @param reason
   */
  error(msg, reason) {
    logger.instance.info(`[Sender] reports an error of a msg:${msg.fields.consumerTag}`);
    this.publish(this.errorExchange, msg.fields.routingKey, msg.content, {
      headers: {
        error: reason,
      },
    });
  }

  /**
   * Applicative nack,
   * verifies if the maximum attempts was reached,
   * in case not publishes the message to the nack exchange.
   * the message would be acked anyway.
   * @param msg
   */
  appNack(msg) {
    let attempts = msg.headers['x-attempts-left'];
    attempts = attempts ? attempts - 1 : DEFAULT_MAX_ATTEMPTS - 1;

    const timeoutInterval = msg.headers['time-out-interval'] ?
      msg.headers['time-out-interval'] : DEFAULT_MESSAGE_TIMEOUT_INTERVAL;
    if (attempts > 0) {
      // message ttl is important because of 2 reasons:
      // 1) to make sure we can track the the message timeout
      // 2) for the routing in the timeout exchange.
      const options = Sender.buildOptionsFromMsg(msg, {
        'x-attempts-left': attempts,
        'message-ttl': timeoutInterval,
      });
      options.replyTo = msg.replyTo;
      // make sure we have the correct queue and bind it to the EXCHANGE
      const queueName = `${this.timeoutQueueNamePrefix}.timeout.${timeoutInterval}`;
      this.channel.assertQueue(queueName, {
        deadLetterExchange: this.nackExchange,
        arguments: {
          'x-message-ttl': timeoutInterval,
          'x-expires': this.queueExpiration || DEFAULT_QUEUE_EXPIRATION,
        },
      })
        .then(() =>
          // we do the routing on this exchange by header. so in this case all messages with the
          // same timeout will be routed to the same queue.
          this.channel.bindQueue(queueName, this.timeoutExchange, '', {
            'x-match': 'any',
            'message-ttl': timeoutInterval,
          })
        )
        .then(() =>
          this.publish(this.timeoutExchange, msg.fields.routingKey, msg.content, options)
        );
    }
    return this.ack(msg.raw);
  }

  /**
   * Sends a response to a queue
   * @param {HandlerResponse} response
   * @returns {*}
   */
  reply(response) {
    if (response.replyTo) {
      this.sendToQueue(response.replyTo, new Buffer(response.body), response.toRabbitOptions());
      return Promise.resolve(true);
    }

    return this.error(response.msg, 'No reply queue was defined')
      .then(() => Promise.reject(new Error('No reply queue was defined')));
  }

  /**
   * Acks a message
   * @param msg
   */
  ack(msg) {
    return this.channel.ack(msg);
  }

  /**
   * Nacks a message
   * @param msg
   * @returns {{deliveryTag, multiple, requeue}}
   */
  nack(msg) {
    return this.channel.nack(msg);
  }
}
