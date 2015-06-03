var gulp = require("gulp"),
    gutil = require("gulp-util"),
    concat = require("gulp-concat"),
    connect = require("gulp-connect"),
    typescript = require("gulp-typescript"),
    sourcemaps = require('gulp-sourcemaps'),
    merge = require('merge2'),

    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer')
;


var project = typescript.createProject({
    sourceMaps: true,
    sortOutput: true,
    noExternalResolve: false,
    target: 'ES5',
    module: 'commonjs',
});

gulp.task('scripts', function() {
    var tsResult = gulp.src(['bt/bin/**.ts', 'bt/lib/**.ts', 'bt/tests/**.ts'], {'base': 'bt/'})
            .pipe(sourcemaps.init())
            .pipe(typescript(project));

        return merge([
            gulp.src(['grammar.js'])
                .pipe(sourcemaps.init()) // make a sourcemap so node-sourcemaps doesn't flip out
                .pipe(concat('grammar.js'))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('build/js/lib')),
            tsResult.js
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('build/js')),
        ]);
});

gulp.task('dist', ['scripts'], function() {
  var b = browserify({
    entries: './build/js/lib/back_talker.js',
    standalone: 'BackTalker',
  });

  return b.bundle()
    .pipe(source('bt.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build/dist/'));
});

gulp.task('watch', ['scripts'], function() {
    gulp.watch('bt/**.ts', ['scripts']);
});

gulp.task('default', ['watch']);
