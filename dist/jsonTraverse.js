"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linkConvertHelper_1 = require("./helpers/linkConvertHelper");
function traverse(node, parentUid, parentContainer, uidMapping) {
    if (node.flags.isPrivate) {
        return;
    }
    var uid = parentUid;
    if (node.kind === 0) {
        uid = node.name;
    }
    var myself = null;
    if ((node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Enumeration') && node.name) {
        uid += '.' + node.name;
        console.log(node.kindString + ": " + uid);
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
    }
    if ((node.kindString === 'Method' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || !node.signatures[0].comment && node.kindString === 'Method') {
            return;
        }
        uid += '.' + node.name;
        console.log(" - " + node.kindString + ": " + uid);
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
        if (node.signatures[0].type && node.signatures[0].type.name && node.signatures[0].type.name !== 'void') {
            myself.syntax.return = {
                type: [node.signatures[0].type.name],
                typeId: node.signatures[0].type.id
            };
        }
        var exceptions = void 0;
        if (node.signatures[0].comment && node.signatures[0].comment.tags) {
            exceptions = node.signatures[0].comment.tags.filter(function (tag) { return tag.tag === 'throws'; });
        }
        if (exceptions && exceptions.length) {
            myself.exceptions = exceptions.map(function (e) { return extractException(e); });
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
    if (node.kindString === 'Enumeration member' && node.name) {
        uid += '.' + node.name;
        console.log(" - " + node.kindString + ": " + uid);
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
        console.log(" - " + node.kindString + ": " + uid);
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
                    type: [node.type.name ? node.type.name : 'union'],
                    typeId: node.type.id
                }
            }
        };
    }
    if (myself) {
        myself.summary = linkConvertHelper_1.convertLinkToGfm(myself.summary);
        uidMapping[node.id] = myself.uid;
        parentContainer.push(myself);
    }
    if (node.children && node.children.length > 0) {
        node.children.forEach(function (subNode) {
            if (myself) {
                traverse(subNode, uid, myself.children, uidMapping);
            }
            else {
                traverse(subNode, uid, parentContainer, uidMapping);
            }
        });
    }
}
exports.traverse = traverse;
function extractException(exception) {
    var tokens = exception.text.match(/{(.*)} +(.*)/);
    if (tokens.length === 3) {
        return {
            type: tokens[1],
            description: tokens[2]
        };
    }
    return null;
}
function findDescriptionInComment(comment) {
    if (comment.tags) {
        var text_1 = null;
        comment.tags.forEach(function (tag) {
            if (tag.tag === 'classdesc' || tag.tag === 'description' || tag.tag === 'exemptedapi') {
                text_1 = tag.text;
                return;
            }
        });
        if (text_1) {
            return text_1.trim();
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
function fillParameters(parameters) {
    if (parameters) {
        return parameters.map(function (p) {
            var description = '';
            if (p.comment) {
                description = (p.comment.shortText && p.comment.shortText !== '') ? p.comment.shortText : p.comment.text;
            }
            return {
                id: p.name,
                type: [p.type.name ? p.type.name : 'function'],
                description: linkConvertHelper_1.convertLinkToGfm(description),
                optional: p.flags && p.flags.isOptional,
                typeId: p.type.id
            };
        });
    }
    return [];
}
function generateCallFunction(prefix, parameters) {
    if (parameters) {
        return prefix + "(" + parameters.map(function (p) { return "" + p.id + (p.optional ? '?' : '') + ": " + p.type; }).join(', ') + ")";
    }
    return '';
}
