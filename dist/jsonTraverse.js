"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linkConvertHelper_1 = require("./helpers/linkConvertHelper");
var idResolver_1 = require("./idResolver");
var flags_1 = require("./common/flags");
var _ = require("lodash");
function traverse(node, parentUid, parentContainer, moduleName, uidMapping, repoConfig) {
    if (node.flags.isPrivate || node.flags.isProtected) {
        return;
    }
    if (node.name && node.name[0] === '_') {
        return;
    }
    var uid = parentUid;
    if (node.kind === 0) {
        uid = node.name;
    }
    if (node.kindString === 'Module' && !moduleName) {
        moduleName = node.name.replace(/"/g, '');
        uid += '.' + moduleName.replace(/\//g, '.');
        console.log(node.kindString + ": " + uid);
    }
    var myself = null;
    if ((node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Enumeration') && node.name) {
        uid += '.' + node.name;
        console.log(node.kindString + ": " + uid);
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name + getGenericType(node.typeParameter),
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : ''
        };
        if (myself.type === 'enumeration') {
            myself.type = 'enum';
        }
        if (node.extendedTypes && node.extendedTypes.length) {
            myself.extends = {
                name: extractType(node.extendedTypes[0])[0]
            };
        }
        if (repoConfig && node.sources && node.sources.length) {
            myself.source = {
                path: node.sources[0].fileName,
                // shift one line up as systematic off for TypeDoc
                startLine: node.sources[0].line > 0 ? node.sources[0].line - 1 : 0,
                remote: {
                    path: repoConfig.basePath + "\\" + node.sources[0].fileName,
                    repo: repoConfig.repo,
                    branch: repoConfig.branch
                }
            };
        }
        var tokens = parentUid.split('.');
        myself.package = tokens[0];
    }
    if ((node.kindString === 'Method' || node.kindString === 'Function' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || node.inheritedFrom) {
            return;
        }
        uid += '.' + node.name;
        console.log(" - " + node.kindString + ": " + uid);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
            type: '',
            langs: ['typeScript'],
            summary: node.signatures[0].comment ? findDescriptionInComment(node.signatures[0].comment) : '',
            syntax: {
                content: ''
            }
        };
        extractInformationFromSignature(myself, node, 0);
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
        if (node.inheritedFrom) {
            return;
        }
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
                content: "" + (node.flags && node.flags.isStatic ? 'static ' : '') + idResolver_1.typeToString(extractType(node.type)[0]) + " " + node.name,
                return: {
                    type: extractType(node.type)
                }
            }
        };
    }
    if (node.kindString === 'Accessor' && node.name) {
        if (node.inheritedFrom) {
            return;
        }
        uid += '.' + node.name;
        console.log(" - " + node.kindString + ": " + uid);
        var signatureType = node.getSignature ? node.getSignature[0].type : node.setSignature[0].type;
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: 'property',
            summary: node.comment ? findDescriptionInComment(node.comment) : '',
            syntax: {
                content: "" + (node.flags && node.flags.isStatic ? 'static ' : '') + idResolver_1.typeToString(extractType(signatureType)[0]) + " " + node.name,
                return: {
                    type: extractType(signatureType)
                }
            }
        };
    }
    if (myself) {
        myself.summary = linkConvertHelper_1.convertLinkToGfm(myself.summary);
        uidMapping[node.id] = myself.uid;
        parentContainer.push(myself);
        if (flags_1.flags.hasModule) {
            if (moduleName) {
                myself.module = moduleName;
            }
            else {
                myself.module = 'Global';
            }
        }
        if (node.comment) {
            var deprecated = findDeprecatedInfoInComment(node.comment);
            if (deprecated != null) {
                myself.deprecated = {
                    content: linkConvertHelper_1.convertLinkToGfm(deprecated)
                };
            }
            var inherits = findInheritsInfoInComment(node.comment);
            if (inherits != null) {
                var tokens = linkConvertHelper_1.getTextAndLink(inherits);
                if (tokens.length === 2) {
                    myself.extends = {
                        name: tokens[0],
                        href: tokens[1]
                    };
                }
            }
            var isPreview = findPreviewInfoInComment(node.comment);
            if (isPreview != null) {
                myself.isPreview = true;
            }
        }
        if (node.signatures && node.signatures.length > 1) {
            for (var index = 1; index < node.signatures.length; index++) {
                var newMethod = _.cloneDeep(myself);
                newMethod.uid = newMethod.uid + "_" + index;
                extractInformationFromSignature(newMethod, node, index);
                parentContainer.push(newMethod);
            }
        }
    }
    if (node.children && node.children.length > 0) {
        node.children.forEach(function (subNode) {
            if (myself) {
                traverse(subNode, uid, myself.children, moduleName, uidMapping, repoConfig);
            }
            else {
                traverse(subNode, uid, parentContainer, moduleName, uidMapping, repoConfig);
            }
        });
    }
}
exports.traverse = traverse;
function extractInformationFromSignature(method, node, signatureIndex) {
    method.syntax.parameters = fillParameters(node.signatures[signatureIndex].parameters);
    if (node.signatures[signatureIndex].type && node.kindString !== 'Constructor' && node.signatures[signatureIndex].type.name && node.signatures[signatureIndex].type.name !== 'void') {
        method.syntax.return = {
            type: extractType(node.signatures[signatureIndex].type)
        };
    }
    var exceptions;
    if (node.signatures[signatureIndex].comment && node.signatures[signatureIndex].comment.tags) {
        exceptions = node.signatures[signatureIndex].comment.tags.filter(function (tag) { return tag.tag === 'throws'; });
    }
    if (exceptions && exceptions.length) {
        method.exceptions = exceptions.map(function (e) { return extractException(e); });
    }
    if (node.kindString === 'Method' || node.kindString === 'Function') {
        method.name = node.name;
        var functionBody = generateCallFunction(method.name, method.syntax.parameters, node.signatures[signatureIndex].typeParameter);
        method.syntax.content = (node.flags && node.flags.isStatic ? 'static ' : '') + "function " + functionBody;
        method.type = node.kindString.toLowerCase();
    }
    else {
        method.name = method.uid.split('.').reverse()[1];
        var functionBody = generateCallFunction(method.name, method.syntax.parameters);
        method.syntax.content = "new " + functionBody;
        method.type = 'constructor';
    }
}
function extractType(type) {
    var result = [];
    if (type.type === 'union' && type.types && type.types.length && type.types[0].name) {
        result.push({
            typeName: type.types[0].name.split('.')[0]
        });
    }
    else if (type.type === 'array') {
        var newType = extractType(type.elementType);
        newType[0].isArray = true;
        result.push(newType[0]);
    }
    else if (type.type === 'reflection' && type.declaration) {
        if (type.declaration.indexSignature && type.declaration.indexSignature.length) {
            result.push({
                reflectedType: {
                    key: {
                        typeName: type.declaration.indexSignature[0].parameters[0].type.name,
                        typeId: type.declaration.indexSignature[0].parameters[0].type.id
                    },
                    value: {
                        typeName: type.declaration.indexSignature[0].type.name,
                        typeId: type.declaration.indexSignature[0].type.id
                    }
                }
            });
        }
        else if (type.declaration.signatures && type.declaration.signatures.length) {
            result.push({
                typeName: generateCallFunction('', fillParameters(type.declaration.signatures[0].parameters)) + " => " + idResolver_1.typeToString(extractType(type.declaration.signatures[0].type)[0])
            });
        }
        else {
            result.push({
                typeName: 'function'
            });
        }
    }
    else if (type.typeArguments && type.typeArguments.length) {
        result.push({
            genericType: {
                outter: {
                    typeName: type.name,
                    typeId: type.id
                },
                inner: extractType(type.typeArguments[0])[0]
            }
        });
    }
    else if (type.name) {
        result.push({
            typeName: type.name,
            typeId: type.id
        });
    }
    else {
        result.push({
            typeName: 'function'
        });
    }
    return result;
}
function extractException(exception) {
    var tokens = exception.text.match(/{(.*)} +((.|\s)+)/);
    if (tokens.length >= 3) {
        return {
            type: tokens[1],
            description: tokens[2]
        };
    }
    return null;
}
function findInheritsInfoInComment(comment) {
    return findInfoInComment('inherits', comment);
}
function findDeprecatedInfoInComment(comment) {
    return findInfoInComment('deprecated', comment);
}
function findPreviewInfoInComment(comment) {
    return findInfoInComment('beta', comment);
}
function findInfoInComment(infoName, comment) {
    if (comment.tags) {
        var text_1 = null;
        comment.tags.forEach(function (tag) {
            if (tag.tag === infoName) {
                text_1 = tag.text;
                return;
            }
        });
        if (text_1) {
            return text_1.trim();
        }
    }
    return null;
}
function findDescriptionInComment(comment) {
    if (comment.tags) {
        var text_2 = null;
        comment.tags.forEach(function (tag) {
            if (tag.tag === 'classdesc' || tag.tag === 'description' || tag.tag === 'exemptedapi') {
                text_2 = tag.text;
                return;
            }
        });
        if (text_2) {
            return text_2.trim();
        }
    }
    if (comment.shortText && comment.text) {
        return comment.shortText + "\n" + comment.text;
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
                type: extractType(p.type),
                description: linkConvertHelper_1.convertLinkToGfm(description),
                optional: p.flags && p.flags.isOptional
            };
        });
    }
    return [];
}
function generateCallFunction(prefix, parameters, typeParameters) {
    if (parameters) {
        return "" + prefix + getGenericType(typeParameters) + "(" + parameters.map(function (p) { return "" + p.id + (p.optional ? '?' : '') + ": " + (idResolver_1.typeToString(p.type[0])); }).join(', ') + ")";
    }
    return '';
}
function getGenericType(typeParameters) {
    if (typeParameters && typeParameters.length) {
        return "<" + typeParameters[0].name + ">";
    }
    return '';
}
