/**
 * Created by asafdavid on 08/12/2015.
 */
require('core-js');
var _ = require('lodash');
var MsgHandler = require('./handler');

/**
 * This class is responsible for invoking the right handler for the provided msg based on its routing key.
 * @param handlers
 * @param defaultHandler
 * @constructor
 */
function HandlerRouter(handlers, defaultHandler) {
  // Validate handlers parameter
  if (!_.isArray(handlers)) throw new Error('Invalid argument, handlers must be an array');
  handlers.forEach(function(handler, i) {
    // validate each handler
    if (!(handler instanceof MsgHandler)) {
      if (!_.isObject(handler)) throw new Error('Invalid handler', handler);
      if (!handler.name || !handler.pattern || !handler.handle) {
        throw new Error('Invalid handler, must contain name, pattern and handler');
      } else {
        var newHandlerInstance = new MsgHandler(handler.name, handler.pattern);
        handlers[i] = newHandlerInstance;
        newHandlerInstance.doHandle = handler.handle;
      }
    }
  });

  // Validate the defaultHandler
  if (!!defaultHandler && !(defaultHandler instanceof MsgHandler))
    throw new Error('Invalid argument, defaultHandler must be an instance of MsgHandler');

  // Initializes data members
  this.handlers = handlers;
  this.defaultHandler = defaultHandler;
}

/**
 * Finds the handler that should handle the provided msg,
 * in case no suitable handler was found, invoke the default handler.
 * @param msg
 */
HandlerRouter.prototype.route = function(sender, msg) {
  var topic = !!msg.properties.headers ? msg.properties.headers.topic : '';
  console.info('[HandlerRouter] routes a message with tag: ' + msg.fields.consumerTag + ' routing key: ' + topic);
  var wasFound = this.handlers.some(function(handler) {
    if (handler.match(topic)) {
      console.info('[HandlerRouter] a handler was found: ' + handler.name);
      handler.handle(sender, msg);
      return true;
    } else {
      return false;
    }
  });

  if (!!this.defaultHandler && !wasFound) {
    console.info('[HandlerRouter] no suitable was found, using default');
    this.defaultHandler.handle(sender, msg);
  }
};

module.exports = HandlerRouter;