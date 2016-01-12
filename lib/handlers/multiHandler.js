/**
 * Created by rom on 01/11/2016.
 */
var _ = require('lodash');
var util = require('util');

var MsgHandler = require('./handler');

/**
 *
 * @param name
 * @param pattern
 * @param topics (optional) - Define the acceptable topics for the handler, could be a list of topics, or a dict
 * @constructor
 */
function MultiMsgHandler(name, pattern, topics) {
  MsgHandler.call(this, name, pattern);
  this.topics = topics;
}

util.inherits(MultiMsgHandler, MsgHandler);

/**
 * Check if the topic supposed to handle in this handler
 * Using RegEx
 * @param routingKey
 */
MultiMsgHandler.prototype.match = function (routingKey) {
  // Check the match
  if (routingKey.match(this.pattern) != null) {
    // If topics undefined return true (topics is optional)
    if (!this.topics) {
      return true;
    }
    // If array, check if the topic is inside the array
    if (_.isArray(this.topics)) {
      return (this.topics.indexOf(routingKey) != -1);
    }
    // If not array (object), check if the topic is part of the object
    else {
      return this.topics.hasOwnProperty(routingKey);
    }
  }
  return false;
};

module.exports = MultiMsgHandler;