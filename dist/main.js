"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsonTraverse_1 = require("./jsonTraverse");
var fs = require("fs-extra");
var serializer = require("js-yaml");
if (process.argv.length < 4) {
    console.log('Usage: node dist/main {apidoc_json_path} {output_path}');
}
var path = process.argv[2];
var outputPath = process.argv[3];
var json = null;
if (fs.existsSync(path)) {
    var dataStr = fs.readFileSync(path).toString();
    json = JSON.parse(dataStr);
}
else {
    console.error('Api doc file ' + path + ' doesn\'t exist.');
    process.exit(1);
}
var classes = [];
if (json) {
    jsonTraverse_1.traverse(json, '', classes);
}
if (classes) {
    classes.forEach(function (classModel) {
        fs.writeFileSync(outputPath + "/" + classModel.name + ".yml", serializer.safeDump(classModel));
    });
}
