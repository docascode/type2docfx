import { YamlModel, YamlParameter, Exception } from './interfaces/YamlModel';
import { Node, Tag, Parameter } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { convertLinkToGfm } from './helpers/linkConvertHelper';

export function traverse(node: Node, parentUid: string, parentContainer: Array<YamlModel>, uidMapping: UidMapping): void {
    if (node.flags.isPrivate) {
        return;
    }

    let uid = parentUid;

    if (node.kind === 0) {
        uid = node.name;
    }
    let myself: YamlModel = null;
    if (node.kindString === 'Class' && node.name) {
        if (!node.comment) {
            return;
        }
        uid += '.' + node.name;
        console.log(uid);
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: 'Class',
            summary: findDescriptionInTags(node.comment.tags)
        };
    }
    if ((node.kindString === 'Method' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || !node.signatures[0].comment && node.kindString === 'Method') {
            return;
        }
        uid += '.' + node.name;
        console.log(uid);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
            langs: ['typeScript'],
            summary: node.signatures[0].comment ? findDescriptionInTags(node.signatures[0].comment.tags) : '',
            syntax: {
                parameters: fillParameters(node.signatures[0].parameters),
                content: ''
            }
        };

        if (node.signatures[0].type && node.signatures[0].type.name !== 'void') {
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

    if (myself) {
        myself.summary = convertLinkToGfm(myself.summary);
        uidMapping[node.id] = myself.uid;
        parentContainer.push(myself);
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(subNode => {
            if (myself) {
                traverse(subNode, uid, myself.children as Array<YamlModel>, uidMapping);
            } else {
                traverse(subNode, uid, parentContainer, uidMapping);
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

function findDescriptionInTags(tags: Array<Tag>): string {
    if (tags) {
        let text: string = null;
        tags.forEach(tag => {
            if (tag.tag === 'classdesc' || tag.tag === 'description') {
                text =  tag.text;
                return;
            }
        });
        if (text) {
            return text;
        }
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
