/**
 * Created by chenrozenes on 12/07/2016.
 */
var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: true,
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

module.exports = logger;
