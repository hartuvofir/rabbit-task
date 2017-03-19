import gulp from 'gulp';
import babel from 'gulp-babel';
import babelCompiler from 'babel-register';

import mocha from 'gulp-mocha';
import eslint from 'gulp-eslint';
import runSequence from 'run-sequence';
import gulpIf from 'gulp-if';

function isFixed(file) {
  // Has ESLint fixed the file contents?
  return file.eslint != null && file.eslint.fixed;
}

gulp.task('lint', () => {
  return gulp.src([
    'examples/**/*.js',
    'src/**/*.js',
    'test/**/*.js',
  ], { base: './' })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('lint-n-fix', () => {
  return gulp.src([
    'examples/**/*.js',
    'src/**/*.js',
    'test/**/*.js',
  ], { base: './' })
  .pipe(eslint({
    fix: true
  }))
  .pipe(eslint.format())
  // if fixed, write the file to dest
  .pipe(gulpIf(isFixed, gulp.dest('.')));
});

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('babel-examples', () => {
  return gulp.src('examples/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('distExamples'));
});

function runTests(reporter = 'spec') {
  return gulp.src('test/**/*.js', { read: false })
    .pipe(mocha({
      reporter,
      compilers: {
        js: babelCompiler
      }
    }))
    .on('error', err => {
      console.log(err);
      process.exit(1);
    });
}

gulp.task('test', () => runTests());

gulp.task('test-ci', () => runTests('mocha-junit-reporter'));

gulp.task('build', done => runSequence('babel', 'babel-examples', 'lint', 'test', done));

gulp.task('build-ci', done => runSequence('babel', 'lint', 'test-ci', done));
