import { YamlModel, YamlParameter } from './interfaces/YamlModel';

export function traverse(node: Node, parentUid: string, parentContainer: Array<YamlModel>): void {
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
            langs: ['js'],
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
            langs: ['js'],
            summary: node.signatures[0].comment ? findDescriptionInTags(node.signatures[0].comment.tags) : '',
            syntax: {
                parameters: fillParameters(node.signatures[0].parameters),
                content: ''
            }
        };
        if (node.kindString === 'Method') {
            myself.fullName = generateCallFunction(myself.name, myself.syntax.parameters);
            myself.syntax.content = `function ${myself.fullName}`;
            myself.type = 'Function';
        } else {
            myself.fullName = generateCallFunction(myself.uid.split('.').reverse()[1], myself.syntax.parameters);
            myself.syntax.content = `new ${myself.fullName}`;
            myself.type = 'Constructor';
        }
    }

    if (myself) {
        parentContainer.push(myself);
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(subNode => {
            if (myself) {
                traverse(subNode, uid, myself.children as Array<YamlModel>);
            } else {
                traverse(subNode, uid, parentContainer);
            }
        });
    }
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
        return parameters.map<YamlParameter>(parameter => <YamlParameter> {
            id: parameter.name,
            type: [parameter.type.name ? parameter.type.name : 'function'],
            description: parameter.comment ? parameter.comment.text : ''
        });
    }
    return [];
}

function generateCallFunction(prefix: string, parameters: Array<YamlParameter>): string {
    if (parameters) {
        return `${prefix}(${parameters.map(p => p.id).join(', ')})`;
    }
    return '';
}

interface Node {
    name: string;
    kind: number;
    kindString: string;
    children: Array<Node>;
    flags: Flags;
    comment: Comment;
    signatures: Array<Signature>;
}

interface Flags {
    isExported: boolean;
    isPrivate: boolean;
}

interface Comment {
    text?: string;
    tags?: Array<Tag>;
}

interface Tag {
    tag: string;
    text: string;
    param: string;
}

interface Signature {
    comment: Comment;
    parameters: Array<Parameter>;
}

interface Parameter {
    name: string;
    type: ParameterType;
    comment: Comment;
}

interface ParameterType {
    type: string;
    name: string;
}
