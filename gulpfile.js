var gulp = require("gulp"),
    gutil = require("gulp-util"),
    concat = require("gulp-concat"),
    connect = require("gulp-connect"),
    jsdoc = require("gulp-jsdoc"),
    typescript = require("gulp-typescript"),
    sourcemaps = require('gulp-sourcemaps'),
    merge = require('merge2'),

    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),

    through = require('through2'),
    canopy = require('canopy'),

    mocha = require('gulp-mocha')
;

var GRAMMAR_FILE = "bt/lib/parser/peg_grammar.peg";


var project = typescript.createProject({
    sourceMaps: true,
    sortOutput: true,
    noExternalResolve: false,
    target: 'ES5',
    module: 'commonjs',
    noEmitOnError: true,
    removeComments: false,
});

var dieAfterFinish = function(message) {
  var installed = false;
  // error handler installs 'end' handler
  return function() {
    if (installed) return;

    installed = true;
    this.on("end", function() {
        console.log(message);
        process.exit(1);
    });
  };
};


gulp.task("canopy", function(end) {
  return gulp.src(GRAMMAR_FILE)
    .pipe(buffer())
    .pipe(through.obj(function (file, encoding, cb) {
      file.contents = Buffer(canopy.compile(file.contents.toString(encoding)));
      this.push(file);
      cb();
    }))
    .pipe(sourcemaps.init()) // make a sourcemap so node-sourcemaps doesn't flip out
    .pipe(concat('peg_grammar.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build/js/lib/parser/'));
});

gulp.task('scripts', function(cb) {
    return gulp.src(['bt/bin/*.ts', 'bt/lib/**/*.ts', 'bt/tests/**/*.ts'], {'base': 'bt/'})
      .pipe(sourcemaps.init())
      .pipe(typescript(project)).js
      .on('error', dieAfterFinish("typescript failed"))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('build/js'));
});

gulp.task('docs', ['scripts'], function() {
  gulp.src(['build/js/lib/**.js'])
    .pipe(jsdoc('build/docs'));
});

gulp.task('dist', ['scripts', 'canopy'], function() {
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

gulp.task('test', ['scripts', 'canopy'], function() {
  return gulp.src(['build/js/tests/*.js'], {read: false})
    .pipe(mocha({
        require: ['source-map-support/register']
    }));
});

gulp.task('watch', ['scripts', 'canopy'], function() {
    gulp.watch('bt/**.ts', ['scripts']);
    gulp.watch(GRAMMAR_FILE, ['canopy']);
});

gulp.task('default', ['watch']);
