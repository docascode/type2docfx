"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linkConvertHelper_1 = require("./helpers/linkConvertHelper");
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
                type: [node.signatures[0].type.name]
            };
        }
        var exceptions = void 0;
        if (node.signatures[0].comment) {
            exceptions = node.signatures[0].comment.tags.filter(function (tag) { return tag.tag === 'throws'; });
        }
        if (exceptions && exceptions.length) {
            myself.exceptions = exceptions.map(function (e) {
                var tokens = e.text.match(/{(.*)} +(.*)/);
                if (tokens.length === 3) {
                    return {
                        type: tokens[1],
                        description: tokens[2]
                    };
                }
            });
        }
        if (node.kindString === 'Method') {
            myself.name = generateCallFunction(myself.name, myself.syntax.parameters);
            myself.syntax.content = "function " + myself.name;
            myself.type = 'method';
        }
        else {
            myself.name = generateCallFunction(myself.uid.split('.').reverse()[1], myself.syntax.parameters);
            myself.syntax.content = "new " + myself.name;
            myself.type = 'constructor';
        }
    }
    if (myself) {
        myself.summary = linkConvertHelper_1.convertLinkToGfm(myself.summary);
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
