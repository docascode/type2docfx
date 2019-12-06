import { YamlModel } from './interfaces/YamlModel';
import { Node } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import * as _ from 'lodash';
import { Converter } from './converters/converter';
import { Context } from './converters/context';

export class Parser {
    public traverse(node: Node, uidMapping: UidMapping, context: Context): YamlModel[] {
        let collection = new Array<YamlModel>();

        if (this.needIgnore(node)) {
            return collection;
        }

        let models = new Converter().convert(node, context);
        for (const model of models) {
            uidMapping[node.id] = model.uid;
            collection.push(model);
        }

        if (!node.children || node.children === []) {
            return collection;
        }

        for (const child of node.children) {
            const uid = models.length > 0 ? models[0].uid : context.PackageName;
            const newContext = new Context(
                context.Repo,
                uid,
                node.kindString,
                context.PackageName,
                context.References);
            if (models.length > 0) {
                models[0].children = [].concat(models[0].children, this.traverse(child, uidMapping, newContext));
            } else {
                collection = [].concat(collection, this.traverse(child, uidMapping, newContext));
            }
        }

        return collection;
    }

    private needIgnore(node: Node): boolean {
        if (node.name && node.name[0] === '_') {
            return true;
        }

        if (node.flags.isPrivate || node.flags.isProtected) {
            return true;
        }

        if (this.isInternal(node)) {
            return true;
        }

        if (!node.flags.isExported
            && node.sources
            && !node.sources[0].fileName.toLowerCase().endsWith('.d.ts')) {
            return true;
        }

        return false;
    }

    private isInternal(node: Node): boolean {
        if (node && node.comment && node.comment.tags) {
            node.comment.tags.forEach(tag => {
                if (tag.tag === 'internal') {
                    return true;
                }
            });
        }

        return false;
    }
}