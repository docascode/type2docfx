"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function traverse(node, parentUid, parentContainer) {
    if (node.flags.isPrivate) {
        return;
    }
    var uid = parentUid;
    if (node.kind === 0) {
        uid = node.name;
    }
    var myself = null;
    if (node.kindString === 'Class' && node.name) {
        if (!node.comment) {
            return;
        }
        uid += '.' + node.name;
        console.log(uid);
        myself = {
            uid: uid,
            name: node.name,
            children: []
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
            children: []
        };
    }
    if (myself) {
        parentContainer.push(myself);
    }
    if (node.children && node.children.length > 0) {
        node.children.forEach(function (subNode) {
            if (myself) {
                traverse(subNode, uid, myself.children);
            }
            else {
                traverse(subNode, uid, parentContainer);
            }
        });
    }
}
exports.traverse = traverse;
