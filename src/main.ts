#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as serializer from 'js-yaml';
import { traverse } from './jsonTraverse';
import { postTransform } from './postTransformer';
import { generateToc } from './tocGenerator';
import { generatePackage } from './packageGenerator';
import { resolveIds } from './idResolver';
import { YamlModel, Syntax, YamlParameter } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';
import { UidMapping } from './interfaces/UidMapping';
import { yamlHeader } from './common/constants';
import { flags } from './common/flags';

if (process.argv.length < 4) {
    console.log('Usage: node dist/main {apidoc_json_path} {output_path}');
}
let path = process.argv[2];
let outputPath = process.argv[3];
let hasModule = false;
if (process.argv[4] === '-m') {
    flags.hasModule = true;
}

let json = null;
if (fs.existsSync(path)) {
    let dataStr = fs.readFileSync(path).toString();
    json = JSON.parse(dataStr);
} else {
    console.error('Api doc file ' + path + ' doesn\'t exist.');
    process.exit(1);
}

let rootElements: YamlModel[] = [];
let uidMapping: UidMapping = {};
if (json) {
    traverse(json, '', rootElements, null, uidMapping);
}

if (rootElements) {
    resolveIds(rootElements, uidMapping);
    let toc = generateToc(rootElements);
    toc = JSON.parse(JSON.stringify(toc));
    fs.writeFileSync(`${outputPath}/toc.yml`, serializer.safeDump(toc));
    console.log('toc genrated.');

    let index = generatePackage(rootElements);
    index = JSON.parse(JSON.stringify(index));
    fs.writeFileSync(`${outputPath}/index.yml`, `${yamlHeader}\n${serializer.safeDump(index)}`);
    console.log('index genrated.');

    console.log('Yaml dump start.');
    rootElements.forEach(rootElement => {
        let transfomredClass = postTransform(rootElement);
        // silly workaround to avoid issue in js-yaml dumper
        transfomredClass = JSON.parse(JSON.stringify(transfomredClass));
        let filename = null;
        if (rootElement.module) {
            filename = `${rootElement.module.replace(/\//g, '.')}.${rootElement.name}`;
        } else {
            filename = rootElement.name;
        }
        filename = filename.split('(')[0];
        console.log(`Dump ${outputPath}/${filename}.yml`);
        fs.writeFileSync(`${outputPath}/${filename}.yml`, `${yamlHeader}\n${serializer.safeDump(transfomredClass)}`);
    });
    console.log('Yaml dump end.');
}
