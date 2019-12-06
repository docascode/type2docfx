import { YamlModel } from './interfaces/YamlModel';
import { Node } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import * as _ from 'lodash';
import { Converter } from './converters/converter';
import { Context } from './converters/context';

export function traverse(node: Node, parentContainer: YamlModel[], uidMapping: UidMapping, context: Context): void {
    if (needIgnore(node)) {
        return;
    }

    const models = new Converter().convert(node, context);
    for (const model of models) {
        uidMapping[node.id] = model.uid;

        parentContainer.push(model);
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            let uid = models.length > 0 ? models[0].uid : context.PackageName;
            if (node.kind === 0) {
                uid = node.name;
            }
            const newContext = new Context(context.Repo, uid, node.kindString, context.PackageName, context.References);
            if (models.length > 0) {
                traverse(child, models[0].children as YamlModel[], uidMapping, newContext);
            } else {
                traverse(child, parentContainer, uidMapping, newContext);
            }
        });
    }
}

function needIgnore(node: Node): boolean {
    if (node.name && node.name[0] === '_') {
        return true;
    }

    if (node.flags.isPrivate || node.flags.isProtected) {
        return true;
    }

    if (isInternal(node)) {
        return true;
    }

    if (!node.flags.isExported 
        && node.sources 
        && !node.sources[0].fileName.toLowerCase().endsWith('.d.ts')) {
        return true;
    }

    return false;
}

function isInternal(node: Node): boolean {
    if (node && node.comment && node.comment.tags) {
        node.comment.tags.forEach(tag => {
            if (tag.tag === 'internal') {
                return true;
            }
        });
    }

    return false;
}