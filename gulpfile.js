var gulp = require("gulp");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tslint({
            options: {
                configuration: 'tslint.json'
            },
            formatter: "verbose"
        }))
        .pipe(tslint.report())
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});
