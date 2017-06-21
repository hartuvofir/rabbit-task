/**
 * Created by rom on 12/01/2016.
 */

import Chance from 'chance';
import _ from 'lodash';

import Connection from './connection';
import Listener from './listener';
import Sender from './sender';

const chance = new Chance();

/**
 * Worker client
 *
 * How does it work?
 * The client connect to RabbitMQ, it send the message to the microservice queue / exchange,
 * and listen to dedicated queue for replies.
 * Both of the replies, the legal and the errors replies received in this queue.
 *
 * When new job is sent with the client, it is send with a new random generated GUID
 * and new Promise is created. The reject and the resolve functions of this Promise are saved in an
 * object in the Client instance (defined by the GUID), and when new message received in the reply
 * or the error queue, it received with the GUID, and the Promise resolve or rejected with the
 * message.
 */
export default class Client {
  /**
   * Creates a new client
   * @param asyncResponseQueue A queue to send async responses to
   * @param consumerTag Consumer tag that identifies the client
   * @param rabbitUrl
   */
  constructor(asyncResponseQueue, consumerTag, rabbitUrl = undefined) {
    // RabbitMQ connection
    rabbitUrl = rabbitUrl || process.env.RABBIT_URL;
    this.conn = new Connection(rabbitUrl);
    // Task list, save the resolve and the reject functions for each task
    this.tasks = {};
    // Define queue names
    this.queueName = undefined;
    // Set Async Response Queue
    this.asyncResponseQueue = asyncResponseQueue;
    // Optional - specify consumer tag
    this.consumerTag = consumerTag ? `${consumerTag}-client` : undefined;
    // Pre Hooks
    this.preHook = function clientPreHook(server, topic, msg, meta, context, replyOpt) {}; // eslint-disable-line
  }

  /**
   * Connect to RabbitMQ
   * @returns {Promise}
   */
  connect() {
    return new Promise((resolve) => {
      this.conn.connect();
      this.conn.on('open', () => {
        this.configureQueues()
          .then(() => this.configureComm())
          .then(() => this.start())
          .then(resolve);
      });
    });
  }

  /**
   * Assert the queue and save the name in this.queueName
   * @returns {*}
   */
  configureQueues() {
    // Create the replies queue
    return this.conn.channel.assertQueue(this.queueName, { exclusive: true })
      .then((queue) => {
        // Save queue name
        this.queueName = queue.queue;
        return true;
      });
  }

  /**
   * Configure the listener and the sender
   * @returns {*}
   */
  configureComm() {
    // Configure listener
    this.listener_reply = new Listener(this.conn.channel, this.queueName, this.consumerTag);

    // Configure sender
    this.sender = new Sender(this.conn.channel);

    return Promise.resolve();
  }

  /**
   * Start the listener, and set the logic when a new message received.
   * @returns {*}
   */
  start() {
    // Configure listeners events for reply queue
    this.listener_reply.on('msg', (msg) => {
      this.sender.ack(msg);
      const msgId = msg.properties.correlationId;
      if (msgId) {
        const isError = !!msg.properties.headers.isError;
        if (isError) {
          this.tasks[msgId].reject(new Error(msg));
        } else {
          this.tasks[msgId].resolve(msg);
        }
        delete this.tasks[msgId];
      }
    });

    // Start listener
    this.listener_reply.start();

    return Promise.resolve();
  }

  /**
   * Close the connection to RabbitMQ and close the runner
   */
  close() {
    return this.conn.channel.connection.close();
  }

  /**
   * Send new message to the worker
   * Return new Promise, and save the resolve and the reject in an object
   * The listener events will resolve or object this Promise by the id
   * @param topic
   * @param msg - JSON, string, array, or whatever
   * @returns {Promise}
   * @private
   */
  _send(server, topic, msg, meta = {}, context = {}, replyOpt = {}) {
    this.preHook(server, topic, msg, meta, context, replyOpt);

    // Generate Task ID
    const id = chance.guid();

    // Set MicroService exchange and queue names
    if (!server || (!server.serverExchangeName && !server.serverQueueName)) {
      throw new Error('You have to set serverExchangeName or serverQueueName');
    }

    // Convert message to Buffer
    msg = new Buffer(JSON.stringify(msg));

    // Set replyTo and replyToTopic
    const replyTo = _.get(replyOpt, 'queue', this.queueName);
    const replyToTopic = _.get(replyOpt, 'topic');

    // Create a promise for the response
    const responsePromise = new Promise((resolve, reject) => {
      // Append task to task list only if the task supposed to return to the client (sync task)
      if (replyTo === this.queueName) {
        this.tasks[id] = { resolve, reject };
      }
    });

    // Send the message
    const sendPromise = new Promise((resolve, reject) => {
      const publish = this.sender.publish(
        server.serverExchangeName,
        server.serverQueueName || topic,
        msg, {
          replyTo,
          headers: { topic, replyToTopic, context, meta },
          messageId: id,
        });
      if (publish) resolve();
      else reject(new Error('publish error'));
    });

    // Return both of the promises
    return { responsePromise, sendPromise };
  }

  /**
   * Send and wait to answer, return a Promise with the answer
   * @param server
   * @param topic
   * @param msg
   * @returns {Promise}
   */
  sendSync(server, topic, msg, meta) {
    const send = this._send(server, topic, msg, meta, {}, {});
    return send.responsePromise;
  }

  /**
   * Send and forget from the answer, the asyncResponseQueue will handle the response
   * @param server
   * @param topic
   * @param msg
   * @param context
   * @param replyOpt
   * @returns {Promise}
   */
  sendAsync(server, topic, msg, meta, context, replyOpt) {
    const send = this._send(
      server,
      topic,
      msg,
      meta,
      context,
      _.extend({}, replyOpt, { queue: this.asyncResponseQueue })
    );
    return send.sendPromise;
  }
}
