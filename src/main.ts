import { traverse } from './jsonTraverse';
import * as fs from 'fs-extra';

if (process.argv.length < 3) {
    console.log('Usage: node dist/main {apidoc_path}');
}
let path = process.argv[2];
let json = null;
if (fs.existsSync(path)) {
    let dataStr = fs.readFileSync(path).toString();
    json = JSON.parse(dataStr);
} else {
    console.error('Api doc file ' + path + ' doesn\'t exist.');
    process.exit(1);
}

if (json) {
    traverse(json, '');
}
