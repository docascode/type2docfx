"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function traverse(node, parentNodeUid) {
    if (node.flags.isPrivate) {
        return;
    }
    var uid = parentNodeUid;
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
        node.children.forEach(function (subNode) {
            traverse(subNode, uid);
        });
    }
}
exports.traverse = traverse;
