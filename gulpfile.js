'use strict';

var gulp = require('gulp');

var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var es = require('event-stream');

var concat = require('gulp-concat');  
var rename = require('gulp-rename');  
var uglify = require('gulp-uglify'); 

var stylesheets = {};
stylesheets.input = [ './vendor/**/*.css', './src/stylesheets/main.scss' ];
stylesheets.concat = [ './vendor/**/*.css' ];
stylesheets.watch = [ './vendor/**/*.css', './vendor/**/*.scss', './src/stylesheets/**/*.scss' ];
stylesheets.output = './assets/stylesheets';

var javascripts = {};
javascripts.input = [ './vendor/leaflet/dist/**/*.js', './vendor/**/*.js', './src/javascripts/components/**/*.js', './src/javascripts/main.js' ];
javascripts.output = './assets/javascripts';


stylesheets.options = {
  errLogToConsole: true,
  outputStyle: 'expanded'
};

var autoprefixerOptions = {
  browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

// Compile sass into CSS
gulp.task('sass', function() {

  var vendorFiles = gulp.src(stylesheets.concat);

  var localFiles = gulp.src('./src/stylesheets/main.scss')
    .pipe(sass(stylesheets.options).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerOptions));

  return es.concat(vendorFiles, localFiles)
    .pipe(concat('main.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(stylesheets.output));
});

gulp.task('scripts', function() {
  return gulp.src(javascripts.input)
    .pipe(concat('main.js'))
    .pipe(gulp.dest(javascripts.output))
})

gulp.task('sass:watch', function () {
  gulp.watch(stylesheets.watch, ['sass']);
});

gulp.task('scripts:watch', function () {
  gulp.watch(javascripts.input, ['scripts']);
});

gulp.task('default', ['sass:watch', 'scripts:watch']);
gulp.task('run', [ 'sass', 'scripts']);