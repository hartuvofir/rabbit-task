/**
 * Created by asafdavid on 10/12/2015.
 */
var Listener = require('./listener');
var Sender = require('./sender');
var logger = require('./logger');

function Worker(name, conn, queue, router, config, options) {
  this.name = name;
  this.conn = conn;
  this.queue = queue;
  this.router = router;
  this.config = config || Promise.resolve();
  this.options = options || {};
};

Worker.prototype.start = function () {
  var that = this;
  var consumerTag = this.options.consumerTag ? this.options.consumerTag + '-worker' : undefined;
  this.conn.connect();
  this.conn.on('open', function () {
    logger.info("[AMQP] channel is open");
    that.config().then(function () {
      var listener = new Listener(that.conn.channel, that.queue, consumerTag);
      var sender = new Sender(that.conn.channel, that.options.errExchange, that.options.nackExchange, that.options.timeoutExchange, that.options.timeoutQueueName, that.options.queueExpiration);
      return { listener: listener, sender: sender };
    }).then(function (comm) {
      comm.listener.start();
      comm.listener.on('msg', function (msg) {
        that.router.route(comm.sender, msg);
      })
    });
  });
}

module.exports = Worker;