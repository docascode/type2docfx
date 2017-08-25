"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsonTraverse_1 = require("./jsonTraverse");
var fs = require("fs-extra");
if (process.argv.length < 3) {
    console.log('Usage: node dist/main {apidoc_path}');
}
var path = process.argv[2];
var json = null;
if (fs.existsSync(path)) {
    var dataStr = fs.readFileSync(path).toString();
    json = JSON.parse(dataStr);
}
else {
    console.error('Api doc file ' + path + ' doesn\'t exist.');
    process.exit(1);
}
if (json) {
    jsonTraverse_1.traverse(json, '');
}
