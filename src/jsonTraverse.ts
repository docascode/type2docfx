import { YamlModel } from './interfaces/YamlModel';
import { Node, Comment } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { convertLinkToGfm, getTextAndLink } from './helpers/linkConvertHelper';
import * as _ from 'lodash';
import { Converter } from './converters/converter';
import { Context } from './converters/context';

export function traverse(node: Node, parentContainer: YamlModel[], uidMapping: UidMapping, context: Context): void {
    if (node.flags.isPrivate || node.flags.isProtected) {
        return;
    }

    if (context.ParentUid.length) {
        if (!node.flags.isExported && node.sources && !node.sources[0].fileName.toLowerCase().endsWith('.d.ts')) {
            return;
        }
    }

    if (node.name && node.name[0] === '_') {
        return;
    }

    if (node.comment || node.signatures && node.signatures.length && node.signatures[0].comment) {
        let comment = node.comment ? node.comment : node.signatures[0].comment;
        let findInternal = findInternalInComment(comment);
        if (findInternal) {
            return;
        }
    }

    if (node.kind === 0) {
        context.ParentUid = node.name;
    }

    const models = new Converter().convert(node, context);

    for (const model of models) {
        const tokens = context.ParentUid.split('.');
        model.package = tokens[0];
        model.summary = convertLinkToGfm(model.summary);
        uidMapping[node.id] = model.uid;

        if (node.comment || node.signatures && node.signatures.length && node.signatures[0].comment) {
            const comment = node.comment ? node.comment : node.signatures[0].comment;
            const deprecated = findDeprecatedInfoInComment(comment);
            if (deprecated != null) {
                model.deprecated = {
                    content: convertLinkToGfm(deprecated)
                };
            }

            const inherits = findInheritsInfoInComment(comment);
            if (inherits != null) {
                const tokens = getTextAndLink(inherits);
                if (tokens.length === 2) {
                    model.extends = {
                        name: tokens[0],
                        href: tokens[1]
                    };
                }
            }

            const isPreview = findPreviewInfoInComment(comment);
            if (isPreview != null) {
                model.isPreview = true;
            }

            const remarks = findRemarkInfoInComment(comment);
            if (remarks != null) {
                model.remarks = convertLinkToGfm(remarks);
            }

            const customModuleName = findModuleInfoInComment(node.comment);
            if (customModuleName) {
                model.module = customModuleName;
            }
        }

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

    function findModuleInfoInComment(comment: Comment): string {
        return findInfoInComment('module', comment);
    }

    function findInheritsInfoInComment(comment: Comment): string {
        return findInfoInComment('inherits', comment);
    }

    function findDeprecatedInfoInComment(comment: Comment): string {
        return findInfoInComment('deprecated', comment);
    }

    function findPreviewInfoInComment(comment: Comment): string {
        return findInfoInComment('beta', comment);
    }

    function findRemarkInfoInComment(comment: Comment): string {
        return findInfoInComment('remarks', comment);
    }

    function findInfoInComment(infoName: string, comment: Comment): string {
        if (comment && comment.tags) {
            let text: string = null;
            comment.tags.forEach(tag => {
                if (tag.tag === infoName) {
                    text = tag.text;
                    return;
                }
            });
            if (text) {
                return text.trim();
            }
        }

        return null;
    }

    function findInternalInComment(comment: Comment): boolean {
        let find = false;
        if (comment && comment.tags) {
            comment.tags.forEach(tag => {
                if (tag.tag === 'internal') {
                    find = true;
                    return;
                }
            });
        }
        return find;
    }
}