/**
 * Created by asafdavid on 10/12/2015.
 */
require('core-js');
var Listener = require('./listener');
var Sender = require('./sender');

function Worker(name, conn, queue, router, config) {
  this.name = name;
  this.conn = conn;
  this.queue = queue;
  this.router = router;
  this.config = config || Promise.resolve();
};

Worker.prototype.start = function () {
  var that = this;
  this.conn.connect();
  this.conn.on('open', function () {
    var listener;
    console.info("[AMQP] channel is open");
    that.config().then(function () {
      var listener = new Listener(that.conn.channel, that.queue);
      var sender = new Sender(that.conn.channel);
      return {listener: listener, sender: sender};
    }).then(function (comm) {
      comm.listener.start();
      comm.listener.on('msg', function (msg) {
        that.router.route(comm.sender, msg);
      })
    });
  });
}

module.exports = Worker;