/**
 * Created by asafdavid on 06/12/2015.
 */

// Use Bluebird
require('babel-runtime/core-js/promise').default = require('bluebird');
global.Promise = require('bluebird');

// Export rabbit-task
export * from './lib';
export * from './service';
