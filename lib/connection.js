/**
 * Created by asafdavid on 07/12/2015.
 */
// External packages
var amqp = require('amqplib');
var EventEmitter = require("events").EventEmitter;
var util = require('util');

/**
 * Represent a connection to the AMQP server
 * @param connectionString
 * @constructor
 */
function Connection() {
  EventEmitter.call(this);

}
util.inherits(Connection, EventEmitter);

/**
 * Connects to the wanted AMQP server and tries to maintain the connection.
 */
Connection.prototype.connect = function(connectionString) {
  this.connectionString = connectionString || 'amqp://localhost';
  var that = this;

  return amqp.connect(connectionString).then(function(conn) {
    // Close the connection on process termination
    process.once('SIGINT', function() { conn.close(); });
    console.info("[AMQP] connected to " + connectionString);

    // Opens a channel
    conn.createChannel().then(function(ch) {
      that.channel = ch;
      that.emit('open', conn);
    });

    // Handle connection error
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
        that.emit('error', err);
      }
    });

    conn.on("close", function(msg) {
      that.emit('close');
      if (msg !== 'Closed by client') {
        console.error("[AMQP] reconnecting");
        setTimeout(that.connect.bind(that), 1000);
      }
    });


  }, function(err) {
    console.error("[AMQP] conn error", err.message);
    that.emit('error', err);
  });
};

// Internal methods
var internals = {};

internals.start = function(connectionString) {
// Connect to the AMQP server
  return amqp.connect(connectionString).then(function(conn) {
    // Close the connection on process termination
    process.once('SIGINT', function() { conn.close(); });
    console.info("[AMQP] connected to " + connectionString);

    conn.createChannel().then(function(ch) {
      exports.channel = ch;
      internals.emitter.emit('open', conn);
    });

    // Handle connection error
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
        internals.emitter.emit('error', err);
      }
    });

    conn.on("close", function(msg) {
      internals.emitter.emit('close');
      if (msg !== 'Closed by client') {
        console.error("[AMQP] reconnecting");
        setTimeout(internals.start, 1000);
      }
    });


  }, function(err) {
    console.error("[AMQP] conn error", err.message);
    internals.emitter.emit('error', err);
  });
};

// Export the connection status
module.exports = new Connection();