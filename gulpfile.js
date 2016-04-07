'use strict';

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const typescript = require('typescript');
const notify = require('gulp-notify');
const browserSync = require('browser-sync');
const babel = require('gulp-babel');
const browserify = require('browserify');
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

var port = 3000;

function startExpress(pushPort) {
    const app = express();

    app.use('/', express.static('dist'));

    app.get('*', function (req, res) {
        res.set('content-type', 'text/html');
        res.send(fs.readFileSync('dist/index.html', 'utf8'));
    });

    app.listen(pushPort);
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
    return gulp.src('src/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

function stylusCompile(){
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
            port: port
        },
        proxy: 'http://localhost:' + (port + 1)
    });
}

gulp.task('clean', function() {
    return clean();
});

gulp.task('bundle', ['clean'], function() {
    return bundle();
});

gulp.task('stylus', ['bundle'], function () {
    return stylusCompile();
});

gulp.task('plot', ['stylus'], function() {
    return plotCopy();
});

gulp.task('baseHtml', ['plot'], function() {
    return baseHtml();
});

gulp.task('translations', ['baseHtml'], function() {
    return translations();
});

gulp.task('browser-sync', ['translations'], function() {
    browserSyncInit();
});

gulp.task('default', ['browser-sync'], function() {
    startExpress(port + 1);

    gulp.watch([
        './src/ts/**/*.ts',
        './src/ts/**/*.tsx'
    ], function() {
        bundle();
    });

    gulp.watch([
        './src/index.html'
    ], function() {
        baseHtml();
    });
    
    gulp.watch([
        './src/styl/**/*.styl'
    ], function() {
        stylusCompile();
    });

    gulp.watch([
        './src/translations/*.json'
    ], function() {
        translations();
    });
});