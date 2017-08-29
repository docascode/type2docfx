import { YamlModel } from './interfaces/YamlModel';

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
            children: [],
            langs: ['js'],
            type: 'Class',
            summary: findDescriptionInTags(node.comment.tags)
        };
    }
    if ((node.kindString === 'Method' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || !node.signatures[0].comment) {
            return;
        }
        uid += '#' + node.name;
        console.log(uid);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
            langs: ['js'],
            summary: findDescriptionInTags(node.signatures[0].comment.tags)
        };
        if (node.kindString === 'Method') {
            myself.type = 'Function';
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
    tags: Array<Tag>;
}

interface Tag {
    tag: string;
    text: string;
    param: string;
}

interface Signature {
    comment: Comment;
}
