const gulp = require('gulp');
const nodemon = require('gulp-nodemon');

gulp.task('start-worker', () => {
  nodemon({
    script: 'worker/worker.js',
    ext: 'js',
    end: { NODE_ENV: 'development' },
  });
});

gulp.task('start-client', () => {
  nodemon({
    script: 'client/client.js',
    ext: 'js',
    end: { NODE_ENV: 'development' },
  });
});
