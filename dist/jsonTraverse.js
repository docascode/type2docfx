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
            myself.syntax.content = generateCallFunction("function " + myself.name, myself.syntax.parameters);
            myself.type = 'Function';
        }
        else {
            myself.syntax.content = generateCallFunction("new " + myself.uid.split('.').reverse()[1], myself.syntax.parameters);
            myself.type = 'Constructor';
        }
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
function findDescriptionInTags(tags) {
    if (tags) {
        var text_1 = null;
        tags.forEach(function (tag) {
            if (tag.tag === 'classdesc' || tag.tag === 'description') {
                text_1 = tag.text;
                return;
            }
        });
        if (text_1) {
            return text_1;
        }
    }
    return '';
}
function fillParameters(parameters) {
    if (parameters) {
        return parameters.map(function (parameter) { return ({
            id: parameter.name,
            type: [parameter.type.name ? parameter.type.name : 'function'],
            description: parameter.comment ? parameter.comment.text : ''
        }); });
    }
    return [];
}
function generateCallFunction(prefix, parameters) {
    if (parameters) {
        return prefix + "(" + parameters.map(function (p) { return p.id; }).join(', ') + ")";
    }
    return '';
}
