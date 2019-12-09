import * as fs from 'fs';
import * as path from 'path';
import * as helper from "./helper";
import * as yaml from 'js-yaml';
import { Node } from '../src/interfaces/TypeDocModel';
import { Context } from '../src/converters/context';
import { Parser } from '../src/parser';

describe('converter', () => {
    const testData = 'tests/data';
    for (const dir of fs.readdirSync(testData)) {
        const dirPath = path.join(testData, dir);
        if (!fs.lstatSync(dirPath).isDirectory()) {
            return;
        }

        describe(dir, () => {
            it('match specs', () => {
                const sample = path.join(dirPath, 'sample.ts');
                const spec = path.join(dirPath, 'spec.yml');
                const data = helper.generate(sample);

                const node = data as any as Node;
                const context = new Context(null, '', '', node.name, new Map<string, string[]>());
                const models = new Parser().traverse(node, {}, context);

                const actual = yaml.dump(models, { noRefs: true }).trim();
                const expected = fs.readFileSync(spec, "utf8").replace(/\r\n/g, '\n').trim();

                expect(actual).toEqual(expected);
            })
        });
    }
});