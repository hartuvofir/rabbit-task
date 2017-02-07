var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
const gulpLoadPlugins = require('gulp-load-plugins');

const plugins = gulpLoadPlugins();

gulp.task('start-worker', function () {
  nodemon({
    script: 'worker/worker.js',
    ext: 'js',
    end: {'NODE_ENV': 'development'}
  })
});

gulp.task('start-client', function () {
  nodemon({
    script: 'client/client.js',
    ext: 'js',
    end: {'NODE_ENV': 'development'}
  })
});