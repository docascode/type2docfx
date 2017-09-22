import { YamlModel, YamlParameter, Exception, Type } from './interfaces/YamlModel';
import { Node, Tag, Parameter, Comment, ParameterType } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { RepoConfig } from './interfaces/RepoConfig';
import { convertLinkToGfm, getTextAndLink } from './helpers/linkConvertHelper';
import { typeToString } from './idResolver';
import { flags } from './common/flags';
import { typePlaceHolder } from './common/constants';
import * as _ from 'lodash';

export function traverse(node: Node, parentUid: string, parentContainer: YamlModel[], moduleName: string, uidMapping: UidMapping, repoConfig: RepoConfig): void {
    if (node.flags.isPrivate || node.flags.isProtected) {
        return;
    }

    if (node.name && node.name[0] === '_') {
        return;
    }

    let uid = parentUid;

    if (node.kind === 0) {
        uid = node.name;
    }

    if (node.kindString === 'Module') {
        moduleName = node.name.replace(/"/g, '');
        uid += '.' + moduleName.replace(/\//g, '.');
        console.log(`${node.kindString}: ${uid}`);
    }

    let myself: YamlModel = null;
    if ((node.kindString === 'Class' || node.kindString === 'Interface' || node.kindString === 'Enumeration') && node.name) {
        uid += '.' + node.name;
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

        if (node.extendedTypes && node.extendedTypes.length) {
            myself.extends = {
                name : extractType(node.extendedTypes[0])[0]
            };
        }

        if (repoConfig && node.sources && node.sources.length) {
            myself.source = {
                path: node.sources[0].fileName,
                // shift one line up as systematic off for TypeDoc
                startLine: node.sources[0].line > 0 ? node.sources[0].line - 1 : 0,
                remote: {
                    path: `${repoConfig.basePath}\\${node.sources[0].fileName}`,
                    repo: repoConfig.repo,
                    branch: repoConfig.branch
                }
            };
        }

        let tokens = parentUid.split('.');
        myself.package = tokens[0];
        if (flags.hasModule) {
            if (moduleName) {
                myself.module = moduleName;
            } else {
                myself.module = 'Global';
            }
        }
    }

    if ((node.kindString === 'Method' || node.kindString === 'Constructor') && node.name) {
        if (!node.signatures || node.inheritedFrom) {
            return;
        }
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            children: [],
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
        if (node.inheritedFrom) {
            return;
        }
        uid += '.' + node.name;
        console.log(` - ${node.kindString}: ${uid}`);
        myself = {
            uid: uid,
            name: node.name,
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : '',
            syntax: {
                content: `${node.flags && node.flags.isStatic ? 'static ' : ''}${typePlaceHolder} ${node.name}`,
                return: {
                    type: extractType(node.type)
                }
            }
        };
    }

    if (myself) {
        myself.summary = convertLinkToGfm(myself.summary);
        uidMapping[node.id] = myself.uid;
        parentContainer.push(myself);

        if (node.comment) {
            let deprecated = findDeprecatedInfoInComment(node.comment);
            if (deprecated != null) {
                myself.deprecated = {
                    content: convertLinkToGfm(deprecated)
                };
            }

            let inherits = findInheritsInfoInComment(node.comment);
            if (inherits != null) {
                let tokens = getTextAndLink(inherits);
                if (tokens.length === 2) {
                    myself.extends = {
                        name: tokens[0],
                        href: tokens[1]
                    };
                }
            }
        }

        if (node.signatures && node.signatures.length > 1) {
            for (let index = 1; index < node.signatures.length; index++) {
                let newMethod = _.cloneDeep(myself);
                newMethod.uid = `${newMethod.uid}_${index}`;
                extractInformationFromSignature(newMethod, node, index);
                parentContainer.push(newMethod);
            }
        }
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(subNode => {
            if (myself) {
                traverse(subNode, uid, myself.children as YamlModel[], moduleName, uidMapping, repoConfig);
            } else {
                traverse(subNode, uid, parentContainer, moduleName, uidMapping, repoConfig);
            }
        });
    }
}

function extractInformationFromSignature(method: YamlModel, node: Node, signatureIndex: number) {
    method.syntax.parameters = fillParameters(node.signatures[signatureIndex].parameters);

    if (node.signatures[signatureIndex].type && node.kindString !== 'Constructor' && node.signatures[signatureIndex].type.name && node.signatures[signatureIndex].type.name !== 'void') {
        method.syntax.return = {
            type: extractType(node.signatures[signatureIndex].type)
        };
    }

    let exceptions;
    if (node.signatures[signatureIndex].comment && node.signatures[signatureIndex].comment.tags) {
        exceptions = node.signatures[signatureIndex].comment.tags.filter(tag => tag.tag === 'throws');
    }

    if (exceptions && exceptions.length) {
        method.exceptions = exceptions.map(e => extractException(e));
    }

    if (node.kindString === 'Method') {
        method.name = node.name;
        let functionBody = generateCallFunction(method.name, method.syntax.parameters, node.signatures[signatureIndex].typeParameter);
        method.syntax.content = `${node.flags && node.flags.isStatic ? 'static ' : ''}function ${functionBody}`;
        method.type = 'method';
    } else {
        method.name = method.uid.split('.').reverse()[1];
        let functionBody = generateCallFunction(method.name, method.syntax.parameters);
        method.syntax.content = `new ${functionBody}`;
        method.type = 'constructor';
    }
}

function extractType(type: ParameterType): Type[] {
    let result: Type[] = [];
    if (type.type === 'union' && type.types && type.types.length && type.types[0].name) {
        result.push({
            typeName: type.types[0].name.split('.')[0]
        });
    } else if (type.type === 'array') {
        let newType = extractType(type.elementType);
        newType[0].isArray = true;
        result.push(newType[0]);
    } else if (type.type === 'reflection' && type.declaration) {
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
        } else if (type.declaration.signatures && type.declaration.signatures.length) {
            result.push({
                typeName: `${generateCallFunction('', fillParameters(type.declaration.signatures[0].parameters))} => ${typeToString(extractType(type.declaration.signatures[0].type)[0])}`
            });
        } else {
            result.push({
                typeName: 'function'
            });
        }
    } else if (type.typeArguments && type.typeArguments.length) {
        result.push({
            genericType: {
                outter: {
                    typeName: type.name,
                    typeId: type.id
                },
                inner: extractType(type.typeArguments[0])[0]
            }
        });
    } else if (type.name) {
        result.push({
            typeName: type.name,
            typeId: type.id
        });
    } else {
        result.push({
            typeName: 'function'
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

function findInheritsInfoInComment(comment: Comment): string {
    return findInfoInComment('inherits', comment);
}

function findDeprecatedInfoInComment(comment: Comment): string {
    return findInfoInComment('deprecated', comment);
}

function findInfoInComment(infoName: string, comment: Comment): string {
    if (comment.tags) {
        let text: string = null;
        comment.tags.forEach(tag => {
            if (tag.tag === infoName) {
                text =  tag.text;
                return;
            }
        });
        if (text) {
            return text.trim();
        }
    }

    return null;
}

function findDescriptionInComment(comment: Comment): string {
    if (comment.tags) {
        let text: string = null;
        comment.tags.forEach(tag => {
            if (tag.tag === 'classdesc' || tag.tag === 'description' || tag.tag === 'exemptedapi') {
                text =  tag.text;
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
