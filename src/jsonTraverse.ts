import { YamlModel, YamlParameter, Exception, Type, UnionType } from './interfaces/YamlModel';
import { Node, Tag, Parameter, Comment, ParameterType } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { RepoConfig } from './interfaces/RepoConfig';
import { convertLinkToGfm, getTextAndLink } from './helpers/linkConvertHelper';
import { typeToString } from './idResolver';
import { flags } from './common/flags';
import * as _ from 'lodash';

export function traverse(node: Node, parentUid: string, parentContainer: YamlModel[], uidMapping: UidMapping, repoConfig: RepoConfig, parentType: string, innerClassReferenceMap: Map<string, string[]>): void {
    if (node.flags.isPrivate || node.flags.isProtected) {
        return;
    }
    if (parentUid.length) {
        if (!node.flags.isExported && !node.sources[0].fileName.toLowerCase().endsWith('.d.ts')) {
            return;
        }
    }
    if (node.name && node.name[0] === '_') {
        return;
    }

    if (node.comment || node.signatures && node.signatures.length && node.signatures[0].comment) {
        let comment = node.comment ? node.comment : node.signatures[0].comment;
        let findInternal = findInternalInComment(comment);
        if (findInternal) {
            return;
        }
    }

    let uid = parentUid;
    if (node.kind === 0) {
        uid = node.name;
    }

    let myself: YamlModel = null;
    if (node.kindString === 'Module') {
        node.name = node.name.replace(/"/g, '');
        node.name = node.name.replace(/\//g, '.');
        uid += `.${node.name}`;
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name + getGenericType(node.typeParameter),
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : ''
        };
        if (repoConfig && node.sources && node.sources.length) {
            myself.source = {
                path: node.sources[0].fileName,
                // shift one line up as systematic off for TypeDoc
                startLine: node.sources[0].line,
                remote: {
                    path: `${repoConfig.basePath}\\${node.sources[0].fileName}`,
                    repo: repoConfig.repo,
                    branch: repoConfig.branch
                }
            };
        }
        console.log(`${node.kindString}: ${uid}`);
    }

    if ((node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Enumeration' || node.kindString === 'Type alias') && node.name) {
        // to add this to handle duplicate class and module under the same hirachy
        if (node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Type alias') {
            if (parentType === 'Class' || parentType === 'Interface') {
                let currentUID = uid + `.${node.name}`;
                let mapping: string[] = [];
                if (innerClassReferenceMap.has(uid)) {
                    mapping = innerClassReferenceMap.get(uid);
                }
                mapping.push(currentUID);
                innerClassReferenceMap.set(uid, mapping);
            }
        }
        uid += `.${node.name}`;
        console.log(`${node.kindString}: ${uid}`);
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

        if (myself.type === 'type alias') {
            let typeArgumentsContent = parseTypeArgumentsForTypeAlias(node);
            if (typeArgumentsContent) {
                myself.syntax = { content: 'type ' + myself.name + typeArgumentsContent + ' = ' + parseTypeDeclarationForTypeAlias(node.type) };
            } else {
                myself.syntax = { content: 'type ' + myself.name + ' = ' + parseTypeDeclarationForTypeAlias(node.type) };
            }
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
                startLine: node.sources[0].line,
                remote: {
                    path: `${repoConfig.basePath}\\${node.sources[0].fileName}`,
                    repo: repoConfig.repo,
                    branch: repoConfig.branch
                }
            };
        }

    }

    if ((node.kindString === 'Method' || node.kindString === 'Function' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures) {
            return;
        }
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
            type: '',
            langs: ['typeScript'],
            summary: '',
            syntax: {
                content: ''
            }
        };

        extractInformationFromSignature(myself, node, 0);
        myself.name = composeMethodNameFromSignature(myself);
    }

    if (node.kindString === 'Enumeration member' && node.name) {
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
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
        console.log(` - ${node.kindString}: ${uid}`);
        let isPublic = node.flags && node.flags.isPublic ? 'public ' : '';
        let isStatic = node.flags && node.flags.isStatic ? 'static ' : '';
        let isOptional = node.flags && node.flags.isOptional ? '?' : '';
        let defaultValue = node.defaultValue ? ` = ${_.trim(node.defaultValue)}` : '';
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : '',
            optional: node.flags && node.flags.isOptional,
            syntax: {
                content: `${isPublic}${isStatic}${node.name}${isOptional}: ${typeToString(extractType(node.type)[0], node.kindString)}${defaultValue}`,
                return: {
                    type: extractType(node.type)
                }
            }
        };
    }

    if (node.kindString === 'Accessor' && node.name) {
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        let signatureType;
        if (node.getSignature) {
            if (Array.isArray(node.getSignature)) {
                signatureType = node.getSignature[0].type;
            } else {
                signatureType = node.getSignature.type;
            }
        } else if (node.setSignature) {
            if (Array.isArray(node.setSignature)) {
                signatureType = node.setSignature[0].type;
            } else {
                signatureType = node.setSignature.type;
            }
        }

        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: 'property',
            summary: node.comment ? findDescriptionInComment(node.comment) : '',
            syntax: {
                content: `${node.flags && node.flags.isStatic ? 'static ' : ''}${typeToString(extractType(signatureType)[0])} ${node.name}`,
                return: {
                    type: extractType(signatureType)
                }
            }
        };
    }

    if (myself) {
        let tokens = parentUid.split('.');
        myself.package = tokens[0];
        myself.summary = convertLinkToGfm(myself.summary);
        uidMapping[node.id] = myself.uid;
        parentContainer.push(myself);
        if (node.comment || node.signatures && node.signatures.length && node.signatures[0].comment) {
            let comment = node.comment ? node.comment : node.signatures[0].comment;
            let deprecated = findDeprecatedInfoInComment(comment);
            if (deprecated != null) {
                myself.deprecated = {
                    content: convertLinkToGfm(deprecated)
                };
            }

            let inherits = findInheritsInfoInComment(comment);
            if (inherits != null) {
                let tokens = getTextAndLink(inherits);
                if (tokens.length === 2) {
                    myself.extends = {
                        name: tokens[0],
                        href: tokens[1]
                    };
                }
            }

            let isPreview = findPreviewInfoInComment(comment);
            if (isPreview != null) {
                myself.isPreview = true;
            }

            let remarks = findRemarkInfoInComment(comment);
            if (remarks != null) {
                myself.remarks = convertLinkToGfm(remarks);
            }

            let customModuleName = findModuleInfoInComment(node.comment);
            if (customModuleName) {
                myself.module = customModuleName;
            }
        }

        if (node.signatures && node.signatures.length > 1) {
            for (let index = 1; index < node.signatures.length; index++) {
                let newMethod = _.cloneDeep(myself);
                newMethod.uid = `${newMethod.uid}_${index}`;
                extractInformationFromSignature(newMethod, node, index);
                newMethod.summary = convertLinkToGfm(newMethod.summary);
                newMethod.name = composeMethodNameFromSignature(newMethod);
                parentContainer.push(newMethod);
            }
        }
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(subNode => {
            if (myself) {
                traverse(subNode, uid, myself.children as YamlModel[], uidMapping, repoConfig, node.kindString, innerClassReferenceMap);
            } else {
                traverse(subNode, uid, parentContainer, uidMapping, repoConfig, node.kindString, innerClassReferenceMap);
            }
        });
    }
}

function composeMethodNameFromSignature(method: YamlModel): string {
    let parameterType = method.syntax.parameters.map(p => {
        return typeToString(p.type[0]);
    }).join(', ');
    return method.name + '(' + parameterType + ')';
}

function parseTypeArgumentsForTypeAlias(node: Node | ParameterType): string
{
    let typeParameter;
    if ((<Node>node).typeParameter) {
        typeParameter = (<Node>node).typeParameter;
    } else if ((<ParameterType>node).typeArguments) {
        typeParameter = (<ParameterType>node).typeArguments;
    }
    if (typeParameter && typeParameter.length) {
        let typeArgumentsList = typeParameter.map(item => {
            return item.name;
        }).join(',');
        typeArgumentsList = '<' + typeArgumentsList + '>';
        return typeArgumentsList;
    }
    return '';
}

function parseTypeDeclarationForTypeAlias(typeInfo: ParameterType): string {
    switch (typeInfo.type) {
        case 'union':
            return parseUnionType(typeInfo);
        case 'tuple':
            return parseTupleType(typeInfo);
        case 'reflection':
            if (typeInfo.declaration) {
                if (typeInfo.declaration.signatures && typeInfo.declaration.signatures.length) {
                    return parseFunctionType(typeInfo);
                }
                if (typeInfo.declaration.children) {
                    return parseUserDefinedType(typeInfo);
                }
                return 'Object';
            }
            break;
        case 'intersection':
            return parseIntersection(typeInfo);
        default:
            let content = 'Object';
            if (typeInfo.name) {
                content = typeInfo.name;
            } else if (typeInfo.value) {
                content = typeInfo.value;
            }
            if(typeInfo.typeArguments && typeInfo.typeArguments.length){
                content += parseTypeArgumentsForTypeAlias(typeInfo);
            }
            return content;
    }
}

function parseUnionType(typeInfo: ParameterType): string {
    let content = '';
    if (typeInfo.types && typeInfo.types.length) {
        content = parseCommonTypeInfo(typeInfo, 'union', ' | ');
    }
    return content;
}

function parseTupleType(typeInfo: ParameterType): string {
    let content = '';
    if (typeInfo.elements && typeInfo.elements.length) {
        content = parseCommonTypeInfo(typeInfo, 'tuple', ', ');
    }
    content = '[ ' + content + ' ]';
    return content;
}

function parseIntersection(typeInfo: ParameterType): string {
    if (typeInfo.types && typeInfo.types.length) {
        return parseCommonTypeInfo(typeInfo, 'intersection', ' & ');
    }
    return '';
}

function parseCommonTypeInfo(typeInfo: ParameterType, type: string, seperator: string): string {
    let typeDeclaration;
    if (type === 'tuple') {
        typeDeclaration = typeInfo.elements;
    } else {
        typeDeclaration = typeInfo.types;
    }
    let content = typeDeclaration.map(item => {
        if (item.name) {
            // for generic
            if (item.typeArguments && item.typeArguments.length) {
                return item.name + '<' + item.typeArguments[0].name + '>';
            } else {
                return item.name;
            }
        } else if (item.value) {
            return `"${item.value}"`;
        } else {
            return parseUserDefinedType(item);
        }
    }).join(seperator);
    return content;
}

function parseFunctionType(typeInfo: ParameterType): string {
    let typeResult = extractType(typeInfo);
    let content = '';
    if (typeResult.length) {
        content = typeResult[0].typeName;
    }
    return content;
}

function parseUserDefinedType(typeInfo: ParameterType): string {
    let content = typeInfo.declaration.children.map(child => {
        let type = '';
        if (child.kindString === 'Variable') {
            if (child.type.name) {
                let typeName = '';
                if (child.type.typeArguments && child.type.typeArguments.length) {
                    typeName = child.type.name + '<' + child.type.typeArguments[0].name + '>';
                } else {
                    typeName = child.type.name;
                }
                type = `${child.name}: ${typeName}`;
            } else if (child.type.value) {
                type = `${child.name}: ${child.type.value}`;
            } else {
                type = `${child.name}: Object`;
            }
        } else if (child.kindString === 'Function') {
            type = `${generateCallFunction(child.name, fillParameters(child.signatures[0].parameters))} => ${typeToString(extractType(child.signatures[0].type)[0])}`;
        }
        return type;

    }).join(', ');
    content = '{ ' + content + ' }';
    return content;
}

function extractInformationFromSignature(method: YamlModel, node: Node, signatureIndex: number) {
    if (node.signatures[signatureIndex].comment) {
        method.summary = findDescriptionInComment(node.signatures[signatureIndex].comment);
    }
    method.syntax.parameters = fillParameters(node.signatures[signatureIndex].parameters);

    if (node.signatures[signatureIndex].type && node.kindString !== 'Constructor' && node.signatures[signatureIndex].type.name !== 'void') {
        method.syntax.return = {
            type: extractType(node.signatures[signatureIndex].type)
        };
    }
    // comment the exception handling for now as template doesn't support it, so CI will not be blocked.
    /*
    let exceptions;
    if (node.signatures[signatureIndex].comment && node.signatures[signatureIndex].comment.tags) {
        exceptions = node.signatures[signatureIndex].comment.tags.filter(tag => tag.tag === 'throws');
    }

    if (exceptions && exceptions.length) {
        method.exceptions = exceptions.map(e => extractException(e));
    }
    */
    if (node.kindString === 'Method' || node.kindString === 'Function') {
        method.name = node.name;
        let functionBody = generateCallFunction(method.name, method.syntax.parameters, node.signatures[signatureIndex].typeParameter);
        method.syntax.content = `${node.flags && node.flags.isStatic ? 'static ' : ''}function ${functionBody}`;
        method.type = node.kindString.toLowerCase();
    } else {
        method.name = method.uid.split('.').reverse()[1];
        let functionBody = generateCallFunction(method.name, method.syntax.parameters);
        method.syntax.content = `new ${functionBody}`;
        method.type = 'constructor';
    }
}

function hasCommonPrefix(types: ParameterType[]): boolean {
    if (types && types.length > 1 && types[0].name) {
        if (types[0].name.indexOf('.') < 0) {
            return false;
        }
        let prefix = types[0].name.split('.')[0];
        types.forEach(t => {
            if (!t.name || t.name.split('.')[0] !== prefix) {
                return false;
            }
        });
        return true;
    }
    return false;
}

function extractType(type: ParameterType): Type[] {
    let result: Type[] = [];
    if (type === undefined) {
        return result;
    }
    if (type.type === 'union' && type.types && type.types.length) {
        if (hasCommonPrefix(type.types)) {
            result.push({
                typeName: type.types[0].name.split('.')[0]
            });
        } else {
            result.push({
                unionType: {
                    types: type.types.map(t => extractType(t)[0])
                }
            });
        }
    } else if (type.type === 'array') {
        let newType = extractType(type.elementType);
        result.push({
            arrayType: newType[0]
        });
    } else if (type.type === 'intersection' && type.types.length) {
        result.push({
            intersectionType: {
                types: type.types.map(t => extractType(t)[0])
            }
        });
    } else if (type.type === 'reflection' && type.declaration) {
        if (type.declaration.indexSignature) {
            let signatures = type.declaration.indexSignature;
            result.push({
                reflectedType: {
                    key: {
                        typeName: signatures.parameters[0].type.name,
                        typeId: signatures.parameters[0].type.id
                    },
                    value: {
                        typeName: signatures.type.name,
                        typeId: signatures.type.id
                    }
                }
            });
        } else if (type.declaration.signatures && type.declaration.signatures.length) {
            result.push({
                typeName: `${generateCallFunction('', fillParameters(type.declaration.signatures[0].parameters))} => ${typeToString(extractType(type.declaration.signatures[0].type)[0])}`
            });
        } else {
            result.push({
                typeName: 'Object'
            });
        }
    } else if (type.typeArguments && type.typeArguments.length) {
        result.push({
            genericType: {
                outter: {
                    typeName: type.name,
                    typeId: type.id
                },
                inner: type.typeArguments.map(t => extractType(t)[0])
            }
        });
    } else if (type.name) {
        result.push({
            typeName: type.name,
            typeId: type.id
        });
    } else if (type.value) {
        result.push({
            typeName: `"${type.value}"`
        });
    } else {
        result.push({
            typeName: 'Object'
        });
    }

    return result;
}

function extractException(exception: Tag): Exception {
    let tokens = exception.text.match(/{(.*)} +((.|\s)+)/);
    if (tokens.length >= 3) {
        return {
            type: tokens[1],
            description: tokens[2]
        };
    }
    return null;
}

function findModuleInfoInComment(comment: Comment): string {
    return findInfoInComment('module', comment);
}

function findInheritsInfoInComment(comment: Comment): string {
    return findInfoInComment('inherits', comment);
}

function findDeprecatedInfoInComment(comment: Comment): string {
    return findInfoInComment('deprecated', comment);
}

function findPreviewInfoInComment(comment: Comment): string {
    return findInfoInComment('beta', comment);
}

function findRemarkInfoInComment(comment: Comment): string {
    return findInfoInComment('remarks', comment);
}

function findInfoInComment(infoName: string, comment: Comment): string {
    if (comment && comment.tags) {
        let text: string = null;
        comment.tags.forEach(tag => {
            if (tag.tag === infoName) {
                text = tag.text;
                return;
            }
        });
        if (text) {
            return text.trim();
        }
    }

    return null;
}

function findInternalInComment(comment: Comment): boolean {
    let find = false;
    if (comment && comment.tags) {
        comment.tags.forEach(tag => {
            if (tag.tag === 'internal') {
                find = true;
                return;
            }
        });
    }
    return find;
}

function findDescriptionInComment(comment: Comment): string {
    if (!comment) {
        return '';
    }

    if (comment.tags) {
        let text: string = null;
        comment.tags.forEach(tag => {
            if (tag.tag === 'classdesc' || tag.tag === 'description' || tag.tag === 'exemptedapi' || tag.tag === 'property') {
                text = tag.text.trim();
                return;
            }
        });
        if (text) {
            return text.trim();
        }
    }

    if (comment.shortText && comment.text) {
        return `${comment.shortText}\n${comment.text}`;
    }

    if (comment.text) {
        return comment.text.trim();
    }

    if (comment.shortText) {
        return comment.shortText.trim();
    }

    return '';
}

function fillParameters(parameters: Parameter[]): YamlParameter[] {
    if (parameters) {
        return parameters.map<YamlParameter>(p => {
            let description = '';
            if (p.comment) {
                description = (p.comment.shortText && p.comment.shortText !== '') ? p.comment.shortText : p.comment.text;
            }
            return <YamlParameter> {
                id: p.name,
                type: extractType(p.type),
                description: convertLinkToGfm(description),
                optional: p.flags && p.flags.isOptional
            };
        });
    }
    return [];
}

function generateCallFunction(prefix: string, parameters: YamlParameter[], typeParameters?: ParameterType[]): string {
    if (parameters) {
        return `${prefix}${getGenericType(typeParameters)}(${parameters.map(p => `${p.id}${p.optional ? '?' : ''}: ${(typeToString(p.type[0]))}`).join(', ')})`;
    }
    return '';
}

function getGenericType(typeParameters: ParameterType[]): string {
    if (typeParameters && typeParameters.length) {
        return `<${typeParameters[0].name}>`;
    }
    return '';
}

function generateTypeAliasInformation(node: Node) {
    if (!node || !node.type || !node.type.types || node.type.type.length < 2) {
        return '';
    }
    let typeAliases = node.type.types.map(t => typeToString(extractType(t)[0]));
    return `"${node.name}" is a type alias. It refers to ${_.take(typeAliases, typeAliases.length - 1).join(', ')} and ${_.last(typeAliases)}.`;
}
