'use strict';

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const typescript = require('typescript');
const notify = require('gulp-notify');
const browserSync = require('browser-sync');
const babel = require('gulp-babel');
const browserify = require('browserify');
const babelify = require('babelify');
const concat = require('gulp-concat');
const watch = require('gulp-watch');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const stylus = require('gulp-stylus');
const jeet = require('jeet');
const nib = require('nib');
const del = require('del');
const fs = require('fs');
const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const app = express();

var port = 1337;

function startExpress(pushPort) {
    const app = express();

    app.use('/', express.static('dist'));

    app.get('/', function (req, res) {
        res.set('content-type', 'text/html');
        res.send(fs.readFileSync('dist/index.html', 'utf8'));
    });

    var api = new ParseServer({
        databaseURI: 'mongodb://localhost:27017/dev', // Connection string for your MongoDB database
        // cloud: '/home/myApp/cloud/main.js', // Absolute path to your Cloud Code
        appId: '123',
        masterKey: '123', // Keep this key secret!
        // fileKey: 'optionalFileKey',
        serverURL: 'http://localhost:1337/parse' // Don't forget to change to https if needed
    });

    app.use('/parse', api);

    let httpServer = require('http').createServer(app);
    httpServer.listen(pushPort);

    var parseLiveQueryServer = ParseServer.createLiveQueryServer(httpServer);
}

function handleTSErrors() {
    var args = Array.prototype.slice.call(arguments);

    notify.onError({
        title: "TypeScript Error",
        message: "<%= error.message %>"
    }).apply(this, args);

    this.emit('end');
}

function clean() {
    return del([
        '.tmp',
        'dist'
    ]);
}

function bundle() {
    return browserify({
        entries: 'src/js/app.jsx',
        extensions: [
            '.jsx',
            '.js'
        ],
        debug: true
    })
        .transform(babelify, {presets: ["es2016", "react"]})
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
}

function stylusCompile() {
    return gulp.src('src/styl/project.styl')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(stylus({
            use: [
                jeet(),
                nib()
            ]
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
}

function plotCopy() {
    return gulp
        .src(['src/plot/*.*'])
        .pipe(gulp.dest('dist/plot'))
        .pipe(browserSync.stream());
}

function baseHtml() {
    return gulp
        .src(['src/index.html'])
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
}

function translations() {
    return gulp
        .src(['src/translations/*.json'])
        .pipe(gulp.dest('dist/translations'))
        .pipe(browserSync.stream());
}

function browserSyncInit() {
    return browserSync.init({
        ui: {
            port: port + 1
        },
        proxy: 'http://localhost:' + port
    });
}

gulp.task('clean', function () {
    return clean();
});

gulp.task('bundle', ['clean'], function () {
    return bundle();
});

gulp.task('stylus', ['bundle'], function () {
    return stylusCompile();
});

gulp.task('plot', ['stylus'], function () {
    return plotCopy();
});

gulp.task('baseHtml', ['plot'], function () {
    return baseHtml();
});

gulp.task('translations', ['baseHtml'], function () {
    return translations();
});

gulp.task('browser-sync', ['translations'], function () {
    browserSyncInit();
});

gulp.task('default', ['browser-sync'], function () {
    startExpress(port);

    gulp.watch([
        './src/js/*.*',
        './src/js/*.*'
    ], function () {
        bundle();
    });

    gulp.watch([
        './src/index.html'
    ], function () {
        baseHtml();
    });

    gulp.watch([
        './src/styl/**/*.styl'
    ], function () {
        stylusCompile();
    });

    gulp.watch([
        './src/translations/*.json'
    ], function () {
        translations();
    });
});
