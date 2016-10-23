'use strict';

const stream = require('stream');

const gulp = require('gulp');
const utils = require('gulp-util');

const rm = require('gulp-rm');
const watch = require('gulp-watch');
const uglify = require('gulp-uglify');
const connect = require('gulp-connect');
const sourcemaps = require('gulp-sourcemaps');

const yargs = require('yargs');
const babelify = require('babelify');
const browserify = require('browserify');
const prettyBytes = require('pretty-bytes');
const versionify = require('browserify-versionify');
const incremental = require('browserify-incremental');

const File = utils.File;

const QELLO = yargs.argv.qello;
const LIVE = yargs.argv.production;

const PORT = 9001;
const SOURCE = './src';
const CACHE = './build.json';
const ASSETS = SOURCE + '/assets';
const DEST = QELLO ? './quello/tvml' : './out';

function pass() {
	return new stream.Transform({
		objectMode: true,
		transform(file, enc, next) {
			next(null, file);
		},
	});
}

function buffer(filename) {
	let chunks = '';

	return new stream.Transform({
		objectMode: true,

		transform(chunk, enc, next) {
			chunks += chunk;
			next();
		},

		flush(done) {
			this.push(new File({
				path: filename,
				contents: new Buffer(chunks),
			}));
			done();
		},
	});
}

gulp.task('clear-cache', function() {
	return gulp
		.src(CACHE, {read: false})
		.pipe(rm());
});

gulp.task('build', function() {
	const build = browserify(Object.assign({}, incremental.args, {
		entries: SOURCE + '/index.js',
		debug: true,
	}));

	if (!LIVE) {
		incremental(build, {cacheFile: CACHE});
	}

	return build
		.on('log', function(info) {
			const parts = info.split(/\s*bytes\s*/);
			parts[0] = prettyBytes(+parts[0]);
			utils.log(utils.colors.green('Build info:'), parts.join(' '));
		})
		.transform(versionify)
		.transform(babelify, {
			global: true,
			presets: ['es2015', 'react'],
			ignore: /moment/,
		})
		.bundle()
		.on('error', function(error) {
			utils.log(utils.colors.red('Browserify compile error:'), error.message);
			this.emit('end');
		})
		.pipe(buffer(QELLO ? 'app.js' : 'application.js'))
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(LIVE ? uglify() : pass())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(DEST))
		.pipe(connect.reload());
});

gulp.task('assets', function() {
	return gulp
		.src(ASSETS + '/**/*', {buffer: false})
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
