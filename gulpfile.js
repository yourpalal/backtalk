var gulp = require("gulp"),
    concat = require("gulp-concat"),
    connect = require("gulp-connect"),
    typescript = require("gulp-typescript"),
    sourcemaps = require('gulp-sourcemaps'),
    merge = require('merge2');
;


var project = typescript.createProject({
    sourceMaps: true,
    sortOutput: true,
    noExternalResolve: false,
    target: 'ES5',
    module: 'commonjs',
});

gulp.task('scripts', function() {
    var tsResult = gulp.src(['bt/back_talker.ts'])
            .pipe(sourcemaps.init())
            .pipe(typescript(project));

        return tsResult.js
                .pipe(concat('app.js'))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('dist/js'));
});

gulp.task('watch', ['scripts'], function() {
    gulp.watch('app/**.ts', ['scripts']);
});

gulp.task('default', ['watch']);