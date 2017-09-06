import { YamlModel, YamlParameter, Exception } from './interfaces/YamlModel';
import { Node, Tag, Parameter, Comment } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { convertLinkToGfm } from './helpers/linkConvertHelper';

export function traverse(node: Node, parentUid: string, parentContainer: Array<YamlModel>, moduleName: string, uidMapping: UidMapping): void {
    if (node.flags.isPrivate) {
        return;
    }

    let uid = parentUid;

    if (node.kind === 0) {
        uid = node.name;
    }

    if (node.kindString === 'Module') {
        moduleName = node.name.replace(/"/g, '');
        uid += '.' + moduleName.replace(/\//g, '.');
        console.log(`${node.kindString}: ${uid}`);
    }

    let myself: YamlModel = null;
    if ((node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Enumeration') && node.name) {
        uid += '.' + node.name;
        console.log(`${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : ''
        };
        if (myself.type === 'enumeration') {
            myself.type = 'enum';
        }

        let tokens = parentUid.split('.');
        myself.package = tokens[0];
        if (moduleName) {
            myself.module = moduleName;
        }
    }

    if ((node.kindString === 'Method' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || !node.signatures[0].comment && node.kindString === 'Method') {
            return;
        }
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
            langs: ['typeScript'],
            summary: node.signatures[0].comment ? findDescriptionInComment(node.signatures[0].comment) : '',
            syntax: {
                parameters: fillParameters(node.signatures[0].parameters),
                content: ''
            }
        };

        if (node.signatures[0].type && node.kindString !== 'Constructor' && node.signatures[0].type.name && node.signatures[0].type.name !== 'void') {
            myself.syntax.return = {
                type: [node.signatures[0].type.name],
                typeId: node.signatures[0].type.id
            };
        }

        let exceptions;
        if (node.signatures[0].comment && node.signatures[0].comment.tags) {
            exceptions = node.signatures[0].comment.tags.filter(tag => tag.tag === 'throws');
        }

        if (exceptions && exceptions.length) {
            myself.exceptions = exceptions.map(e => extractException(e));
        }

        if (node.kindString === 'Method') {
            myself.name = generateCallFunction(myself.name, myself.syntax.parameters);
            myself.syntax.content = `function ${myself.name}`;
            myself.type = 'method';
        } else {
            myself.name = generateCallFunction(myself.uid.split('.').reverse()[1], myself.syntax.parameters);
            myself.syntax.content = `new ${myself.name}`;
            myself.type = 'constructor';
        }
    }

    if (node.kindString === 'Enumeration member' && node.name) {
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
            langs: ['typeScript'],
            summary: node.comment ? findDescriptionInComment(node.comment) : '',
            type: 'field'
        };
        if (node.defaultValue) {
            myself.numericValue = parseInt(node.defaultValue, 10);
        }
    }

    if (node.kindString === 'Property' && node.name) {
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : '',
            syntax: {
                return: {
                    type : [ node.type.name ? node.type.name : 'union' ],
                    typeId : node.type.id
                }
            }
        };
    }

    if (myself) {
        myself.summary = convertLinkToGfm(myself.summary);
        uidMapping[node.id] = myself.uid;
        parentContainer.push(myself);
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(subNode => {
            if (myself) {
                traverse(subNode, uid, myself.children as Array<YamlModel>, moduleName, uidMapping);
            } else {
                traverse(subNode, uid, parentContainer, moduleName, uidMapping);
            }
        });
    }
}

function extractException(exception: Tag): Exception {
    let tokens = exception.text.match(/{(.*)} +(.*)/);
    if (tokens.length === 3) {
        return {
            type: tokens[1],
            description: tokens[2]
        };
    }
    return null;
}

function findDescriptionInComment(comment: Comment): string {
    if (comment.tags) {
        let text: string = null;
        comment.tags.forEach(tag => {
            if (tag.tag === 'classdesc' || tag.tag === 'description' || tag.tag === 'exemptedapi') {
                text =  tag.text;
                return;
            }
        });
        if (text) {
            return text.trim();
        }
    }

    if (comment.text) {
        return comment.text.trim();
    }

    if (comment.shortText) {
        return comment.shortText.trim();
    }

    return '';
}

function fillParameters(parameters: Array<Parameter>): Array<YamlParameter> {
    if (parameters) {
        return parameters.map<YamlParameter>(p => {
            let description = '';
            if (p.comment) {
                description = (p.comment.shortText && p.comment.shortText !== '') ? p.comment.shortText : p.comment.text;
            }
            return <YamlParameter> {
                id: p.name,
                type: [p.type.name ? p.type.name : 'function'],
                description: convertLinkToGfm(description),
                optional: p.flags && p.flags.isOptional,
                typeId: p.type.id
            };
        });
    }
    return [];
}

function generateCallFunction(prefix: string, parameters: Array<YamlParameter>): string {
    if (parameters) {
        return `${prefix}(${parameters.map(p => `${p.id}${p.optional ? '?' : ''}: ${p.type}`).join(', ')})`;
    }
    return '';
}
