var gulp = require("gulp");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var tsProject = ts.createProject("tsconfig.json");
var sourcemaps = require('gulp-sourcemaps');

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tslint({
            options: {
                configuration: 'tslint.json'
            },
            formatter: "verbose"
        }))
        .pipe(tslint.report())
        .pipe(sourcemaps.init())
        .pipe(tsProject())        
        .js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist"));
});
