export function traverse(node: Node, parentNodeUid: string) {
    if (node.flags.isPrivate) {
        return;
    }

    let uid = parentNodeUid;

    if (node.kind === 0) {
        uid = node.name;
    }
    if (node.kindString === 'Class' && node.name) {
        if (!node.comment) {
            return;
        }
        uid += '.' + node.name;
        console.log(uid);
    }
    if ((node.kindString === 'Method' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || !node.signatures[0].comment) {
            return;
        }
        uid += '#' + node.name;
        console.log(uid);
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(subNode => {
            traverse(subNode, uid);
        });
    }
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
