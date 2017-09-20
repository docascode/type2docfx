import { YamlModel, YamlParameter, Exception, Type } from './interfaces/YamlModel';
import { Node, Tag, Parameter, Comment, ParameterType } from './interfaces/TypeDocModel';
import { UidMapping } from './interfaces/UidMapping';
import { RepoConfig } from './interfaces/RepoConfig';
import { convertLinkToGfm } from './helpers/linkConvertHelper';
import { typeToString } from './idResolver';
import { flags } from './common/flags';
import { typePlaceHolder } from './common/constants';

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
            fullName: node.name,
            children: [],
            langs: ['typeScript'],
            type: node.kindString.toLowerCase(),
            summary: node.comment ? findDescriptionInComment(node.comment) : ''
        };
        if (myself.type === 'enumeration') {
            myself.type = 'enum';
        }

        if (node.extendedTypes && node.extendedTypes.length) {
            myself.extends = extractType(node.extendedTypes[0]);
        }

        if (repoConfig && node.sources && node.sources.length) {
            myself.source = {
                path: node.sources[0].fileName,
                startLine: node.sources[0].line,
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
                parameters: fillParameters(node.signatures[0].parameters),
                content: ''
            }
        };

        if (node.signatures[0].type && node.kindString !== 'Constructor' && node.signatures[0].type.name && node.signatures[0].type.name !== 'void') {
            myself.syntax.return = {
                type: extractType(node.signatures[0].type)
            };
        }

        let exceptions;
        if (node.signatures[0].comment && node.signatures[0].comment.tags) {
            exceptions = node.signatures[0].comment.tags.filter(tag => tag.tag === 'throws');
        }

        if (exceptions && exceptions.length) {
            myself.exceptions = exceptions.map(e => extractException(e));
        }

        if (node.kindString === 'Method') {
            myself.name = generateCallFunction(myself.name, myself.syntax.parameters);
            myself.syntax.content = `${node.flags && node.flags.isStatic ? 'static ' : ''}function ${myself.name}`;
            myself.type = 'method';
        } else {
            myself.name = generateCallFunction(myself.uid.split('.').reverse()[1], myself.syntax.parameters);
            myself.syntax.content = `new ${myself.name}`;
            myself.type = 'constructor';
        }
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
                myself.extends = [
                    convertLinkToGfm(inherits)
                ];
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
    } else if (type.type === 'reflection' && type.declaration && type.declaration.indexSignature && type.declaration.indexSignature.length) {
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
    let tokens = exception.text.match(/{(.*)} +(.*)/);
    if (tokens.length === 3) {
        return {
            type: tokens[1],
            description: tokens[2]
        };
    }
    return null;
}

function findInheritsInfoInComment(comment: Comment): string {
    return findInfoInComment('inherited', comment);
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

function generateCallFunction(prefix: string, parameters: YamlParameter[]): string {
    if (parameters) {
        return `${prefix}(${parameters.map(p => `${p.id}${p.optional ? '?' : ''}: ${(typeToString(p.type[0]))}`).join(', ')})`;
    }
    return '';
}
