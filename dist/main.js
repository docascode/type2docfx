#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var serializer = require("js-yaml");
var jsonTraverse_1 = require("./jsonTraverse");
var postTransformer_1 = require("./postTransformer");
var tocGenerator_1 = require("./tocGenerator");
var idResolver_1 = require("./idResolver");
var constants_1 = require("./common/constants");
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
var uidMapping = {};
if (json) {
    jsonTraverse_1.traverse(json, '', classes, uidMapping);
}
if (classes) {
    idResolver_1.resolveIds(classes, uidMapping);
    var toc = tocGenerator_1.tocGenerator(classes);
    fs.writeFileSync(outputPath + "/toc.yml", serializer.safeDump(toc));
    console.log('toc genrated.');
    console.log('Yaml dump start.');
    classes.forEach(function (classModel) {
        var transfomredClass = postTransformer_1.postTransform(classModel);
        // silly workaround to avoid issue in js-yaml dumper
        transfomredClass = JSON.parse(JSON.stringify(transfomredClass));
        console.log("Dump " + outputPath + "/" + classModel.name + ".yml");
        fs.writeFileSync(outputPath + "/" + classModel.name.split('(')[0] + ".yml", constants_1.yamlHeader + "\n" + serializer.safeDump(transfomredClass));
    });
    console.log('Yaml dump end.');
}
