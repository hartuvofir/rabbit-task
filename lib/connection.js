/**
 * Created by asafdavid on 07/12/2015.
 */
// External packages
var amqp = require('amqplib');
var EventEmitter = require("events").EventEmitter;
var util = require('util');

const RECONNECTION_TIMEOUT = 1000;
const RETRY_CONNECT_TIMEOUT = 5000;

/**
 * Represent a connection to the AMQP server
 * @param connectionString
 * @constructor
 */
function Connection(connectionString) {
  EventEmitter.call(this);
  this.connectionString = connectionString || 'amqp://localhost';
}
util.inherits(Connection, EventEmitter);

/**
 * Connects to the wanted AMQP server and tries to maintain the connection.
 */
Connection.prototype.connect = function() {
  var that = this;

  return amqp.connect(that.connectionString).then(function(conn) {
    // Close the connection on process termination
    process.once('SIGINT', function() { conn.close(); });
    console.info("[AMQP] connected to " + that.connectionString);

    // Opens a channel
    conn.createChannel().then(function(ch) {
      that.channel = ch;
      that.emit('open', conn);
    });

    // Handle connection error
    conn.on("error", function(err) {
      if (err.message == "read ECONNRESET") {
        console.error("[AMQP] reconnecting");
        setTimeout(that.connect.bind(that), RECONNECTION_TIMEOUT);
      }
      else if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
        that.emit('error', err);
      }
    });

    conn.on("close", function(msg) {
      that.emit('close');
      if (!!msg && msg !== 'Closed by client' && !msg.match(/Error/)) {
        console.error("[AMQP] reconnecting");
        setTimeout(that.connect.bind(that), RECONNECTION_TIMEOUT);
      }
    });

  }, function(err) {
    console.error("[AMQP] conn error", err.message);
    if (err.message.match(/ECONNREFUSED/)) {
      console.error("[AMQP] reconnecting");
      setTimeout(that.connect.bind(that), RETRY_CONNECT_TIMEOUT);
    }
    that.emit('error', err);
  });
};

// Export the connection status
module.exports = Connection;