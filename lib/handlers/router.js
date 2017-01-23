/**
 * Created by asafdavid on 08/12/2015.
 */
var _ = require('lodash');
var MsgHandler = require('./handler');
var logger = require('../logger');

/**
 * This class is responsible for invoking the right handler for the provided msg based on its routing key.
 * @param () - use arguments variable to get all the arguments
 * @constructor
 */
function HandlerRouter(handlers) {
  // Validate handlers parameter
  if (!_.isArray(handlers)) throw new Error('Invalid argument, handlers must be an array');
  handlers.forEach(function(handler, i) {
    // validate each handler
    if (!(handler instanceof MsgHandler)) {
      if (!_.isObject(handler)) throw new Error('Invalid handler', handler);
      if (!handler.name || !handler.pattern || !handler.handle) {
        throw new Error('Invalid handler, must contain name, pattern and handler');
      }
      else {
        var baseHandler = !!handler.base ? handler.base : MsgHandler;
        var options = !!handler.options ? handler.options : {};

        var newHandlerInstance = new baseHandler(handler.name, handler.pattern, options);
        handlers[i] = newHandlerInstance;
        newHandlerInstance.doHandle = handler.handle;
      }
    }
  });

  // Initializes data members
  this.handlers = handlers;
}

/**
 * Set the default handler
 * @param defaultHandler
 */
HandlerRouter.prototype.setDefaultHandler = function(defaultHandler) {
  //// Validate the defaultHandler
  if (!!defaultHandler && !(defaultHandler instanceof MsgHandler))
    throw new Error('Invalid argument, defaultHandler must be an instance of MsgHandler');

  this.defaultHandler = defaultHandler;
};

/**
 * Function to run before the handler handle the message
 * Good for logs
 * @param sender
 * @param msg
 * @returns {Promise.<T>}
 */
HandlerRouter.prototype.preRoute = function(sender, msg) {
  return Promise.resolve();
};

/**
 * Function to run after the handler handle the message
 * Good for logs
 * @param msg
 * @param res
 * @param err
 * @returns {Promise.<T>}
 */
HandlerRouter.prototype.postRoute = function(msg, res, err) {
  return Promise.resolve();
};

/**
 * Finds the handler that should handle the provided msg,
 * in case no suitable handler was found, invoke the default handler.
 * @param msg
 */
HandlerRouter.prototype.route = function(sender, msg) {
  var self = this;
  var topic = !!msg.properties.headers ? msg.properties.headers.topic : '';
  return self.preRoute(sender, msg)
    .then(() => {
      logger.instance.info('[HandlerRouter] routes a message with tag and routing key' + msg.fields.consumerTag + ' routing key: ' + topic);
      var wasFound = this.handlers.some(function(handler) {
        if (handler.match(topic)) {
          logger.instance.info('[HandlerRouter] a handler was found: ' + handler.name);
          handler.handle(sender, msg)
            .then((res) => self.postRoute(msg, res, null))
            .catch((err) => self.postRoute(msg, null, err));
          return true;
        } else {
          return false;
        }
      });

      if (!!this.defaultHandler && !wasFound) {
        logger.instance.info('[HandlerRouter] no suitable was found, using default');
        this.defaultHandler.handle(sender, msg);
        self.postRoute(msg, null, new Error('Not Found'));
      }
    })
    .catch(() => {
      logger.instance.info('[HandlerRouter] handle declined by the router preRoute hook');
    })
};

module.exports = HandlerRouter;