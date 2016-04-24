/**
 * Created by rom on 12/01/2016.
 */

var Chance = require('chance'),
  chance = new Chance();

var _ = require('lodash');

var Connection = require('./connection');

var Listener = require('./listener');
var Sender = require('./sender');

/**
 * Worker client
 *
 * How does it work?
 * The client connect to RabbitMQ, it send the message to the microservice queue / exchange, and listen to dedicated queue for replies.
 * Both of the replies, the legal and the errors replies received in this queue.
 *
 * When new job is sent with the client, it is send with a new random generated GUID and new Promise is created.
 * The reject and the resolve functions of this Promise are saved in an object in the Client instance (defined by the GUID),
 * and when new message received in the reply or the error queue, it received with the GUID, and the Promise resolve or rejected with the message.
 * @constructor
 */
function Client(asyncResponseQueue) {
  // RabbitMQ connection
  this.conn = new Connection(process.env.RABBIT_URL);
  // Task list, save the resolve and the reject functions for each task
  this.tasks = {};
  // Define queue names
  this.queueName = undefined;
  // Set Async Response Queue
  this.asyncResponseQueue = asyncResponseQueue;
}

/**
 * Connect to RabbitMQ
 * @returns {Promise}
 */
Client.prototype.connect = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.conn.connect();
    self.conn.on('open', () => {
      self.configureQueues()
      .then(self.configureComm.bind(self))
      .then(self.start.bind(self))
      .then(resolve);
    });
  })
};

/**
 * Assert the queue and save the name in this.queueName
 * @returns {*}
 */
Client.prototype.configureQueues = function() {
  // Create the replies queue
  return this.conn.channel.assertQueue(this.queueName, {exclusive: true})
  .then((queue) => {
    // Save queue name
    this.queueName = queue.queue;
    return true;
  });
};

/**
 * Configure the listener and the sender
 * @returns {*}
 */
Client.prototype.configureComm = function() {
  // Configure listener
  this.listener_reply = new Listener(this.conn.channel, this.queueName);

  // Configure sender
  this.sender = new Sender(this.conn.channel);

  return Promise.resolve();
};

/**
 * Start the listener, and set the logic when a new message received.
 * @returns {*}
 */
Client.prototype.start = function() {
  var self = this;

  // Configure listeners events for reply queue
  this.listener_reply.on('msg', function(msg) {
    self.sender.ack(msg);
    var msgId = msg.properties.correlationId;
    if (msgId) {
      if (!!msg.properties.headers.isError)
        self.tasks[msgId].reject(msg);
      else
        self.tasks[msgId].resolve(msg);
      delete self.tasks[msgId]
    }
  });

  // Start listener
  this.listener_reply.start();

  return Promise.resolve();
};

/**
 * Close the connection to RabbitMQ and close the runner
 */
Client.prototype.close = function() {
  return this.conn.channel.connection.close();
};

/**
 * Send new message to the worker
 * Return new Promise, and save the resolve and the reject in an object
 * The listener events will resolve or object this Promise by the id
 * @param topic
 * @param msg - JSON, string, array, or whatever
 * @returns {Promise}
 */
Client.prototype._send = function(server, topic, msg, context, replyOpt) {
  var self = this;

  // Generate Task ID
  var id = chance.guid();

  // Set MicroService exchange and queue names
  if (!server || (!server.serverExchangeName && !server.serverQueueName))
    throw new Error("You have to set serverExchangeName or serverQueueName");


  // Convert message to Buffer
  msg = new Buffer(JSON.stringify(msg));
  
  // Set replyTo and replyToTopic
  var replyTo = _.get(replyOpt, 'queue', self.queueName);
  var replyToTopic = _.get(replyOpt, 'topic');

  // Create a promise for the response
  var responsePromise = new Promise(function(resolve, reject) {
    // Append task to task list only if the task supposed to return to the client (sync task)
    if (replyTo == self.queueName) {
      self.tasks[id] = {resolve: resolve, reject: reject};
    }
  });

  // Send the message
  var sendPromise = new Promise(function(resolve, reject) {
    var publish = self.sender.publish(server.serverExchangeName, server.serverQueueName || topic, msg, {
      replyTo: replyTo,
      headers: {topic: topic, replyToTopic: replyToTopic, context: context},
      messageId: id
    });
    if (publish) resolve();
    else reject();
  });

  // Return both of the promises
  return {responsePromise, sendPromise};
};

/**
 * Send and wait to answer, return a Promise with the answer
 * @param server
 * @param topic
 * @param msg
 * @returns {Promise}
 */
Client.prototype.sendSync = function(server, topic, msg) {
  var send = this._send(server, topic, msg, {}, {});
  return send.responsePromise;
};

/**
 * Send and forget from the answer, the asyncResponseQueue will handle the response
 * @param server
 * @param topic
 * @param msg
 * @param context
 * @param replyOpt
 * @returns {Promise}
 */
Client.prototype.sendAsync = function(server, topic, msg, context, replyOpt) {
  var send = this._send(server, topic, msg, context, _.extend({}, replyOpt, {queue: this.asyncResponseQueue}));
  return send.sendPromise;
};

module.exports = Client;
