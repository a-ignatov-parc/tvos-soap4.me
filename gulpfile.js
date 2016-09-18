var gulp = require('gulp');
var gutil = require('gulp-util');

var rm = require('gulp-rm');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var sourcemaps = require('gulp-sourcemaps');

var yargs = require('yargs');
var xtend = require('xtend');
var babelify = require('babelify');
var browserify = require('browserify');
var prettyBytes = require('pretty-bytes');
var incremental = require('browserify-incremental');

var through = require('through2');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var LIVE = yargs.argv.production;
var QUELLO = yargs.argv.quello;

var PORT = 9001;
var SOURCE = './src';
var CACHE = './build.json';
var ASSETS = SOURCE + '/assets';
var DEST = QUELLO ? './quello/tvml' : './out';

function pass() {
	return through.obj();
}

gulp.task('clear-cache', function() {
	return gulp
		.src(CACHE, {read: false})
		.pipe(rm());
});

gulp.task('build', function() {
	var build = browserify(xtend(incremental.args, {
		entries: SOURCE + '/index.js',
		debug: true,
	}));

	if (!LIVE) {
		incremental(build, {cacheFile: CACHE});
	}

	return build
		.on('log', function(info) {
			var parts = info.split(/\s*bytes\s*/);
			parts[0] = prettyBytes(+parts[0]);
			gutil.log(gutil.colors.green('Build info:'), parts.join(' '));
		})
		.transform(babelify, {
			global: true,
			presets: ['es2015', 'react'],
			ignore: /moment/,
		})
		.bundle()
		.on('error', function(error) {
			gutil.log(gutil.colors.red('Browserify compile error:'), error.message);
			this.emit('end');
		})
		.pipe(source(QUELLO ? 'app.js' : 'application.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(LIVE ? uglify() : pass())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(DEST))
		.pipe(connect.reload());
});

gulp.task('assets', function() {
	return gulp
		.src(ASSETS + '/**/*')
		.pipe(gulp.dest(DEST + '/assets'));
});

gulp.task('watch', ['clear-cache'], function() {
	gulp.start('build', 'assets');

	watch([SOURCE + '/**/*.js'], function() {
		gulp.start('build');
	});

	watch([ASSETS + '/**/*'], function() {
		gulp.start('assets');
	});
});

gulp.task('serve', ['watch'], function() {
	connect.server({
		root: DEST,
		port: PORT,
	});
});

gulp.task('default', ['build', 'assets']);
