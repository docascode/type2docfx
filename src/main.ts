#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as serializer from 'js-yaml';
import { traverse } from './jsonTraverse';
import { postTransform } from './postTransformer';
import { tocGenerator } from './tocGenerator';
import { YamlModel, Syntax, YamlParameter } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';
import { yamlHeader } from './common/constants';

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
    let toc = tocGenerator(classes);
    fs.writeFileSync(`${outputPath}/toc.yml`, serializer.safeDump(toc));
    console.log('toc genrated.');

    console.log('Yaml dump start.');
    classes.forEach(classModel => {
        let transfomredClass = postTransform(classModel);
        console.log(`Dump ${outputPath}/${classModel.name}.yml`);
        fs.writeFileSync(`${outputPath}/${classModel.name}.yml`, `${yamlHeader}\n${serializer.safeDump(transfomredClass)}`);
    });
    console.log('Yaml dump end.');
}
