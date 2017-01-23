/**
 * Created by asafdavid on 09/12/2015.
 */

var util = require('util');
var Handler = require('./handler');
var logger = require('../logger');

/**
 * Unknown topic handler, used as BookMD's default handler
 * @constructor
 */
function UnknownHandler() {
  Handler.call(this, 'unknownTopicHandler', '#');
}
util.inherits(UnknownHandler, Handler);

/**
 * Send the message to the error queue and ack it
 * @param msg
 */
UnknownHandler.prototype.doHandle = function(msg) {
  logger.instance.info('[UnknownHandler] handles msg' , {body: msg});
  return Promise.reject(new Error(msg.content));
};

module.exports = UnknownHandler;