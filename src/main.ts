#!/usr/bin/env node

import { traverse } from './jsonTraverse';
import * as fs from 'fs-extra';
import * as serializer from 'js-yaml';
import { YamlModel } from './interfaces/YamlModel';

if (process.argv.length < 4) {
    console.log('Usage: node dist/main {apidoc_json_path} {output_path}');
}
let path = process.argv[2];
let outputPath = process.argv[3];

let json = null;
if (fs.existsSync(path)) {
    let dataStr = fs.readFileSync(path).toString();
    json = JSON.parse(dataStr);
} else {
    console.error('Api doc file ' + path + ' doesn\'t exist.');
    process.exit(1);
}

let classes: Array<YamlModel> = [];
if (json) {
    traverse(json, '', classes);
}

if (classes) {
    classes.forEach(classModel => {
        fs.writeFileSync(`${outputPath}/${classModel.name}.yml`, serializer.safeDump(classModel));
    });
}
