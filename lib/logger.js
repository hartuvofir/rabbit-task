/**
 * Created by chenrozenes on 12/07/2016.
 */

var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: false,
      stringify: true,
      prettyPrint: true,
      colorize: true,
      handleExceptions: true,
      timestamp: true,
      humanReadableUnhandledException: true,
      stderrLevels: ['error'],
      level: 'debug'
    })
  ]
});

const LoggerObj = {
  instance: logger,
  setLogger: function setLogger(loggerInstance) {
    LoggerObj.instance = loggerInstance;
  },
};

module.exports = LoggerObj;
