import { YamlModel, YamlParameter, Type } from '../interfaces/YamlModel';
import { Node, Parameter, Comment, ParameterType } from '../interfaces/TypeDocModel';
import { typeToString } from '../idResolver';
import { convertLinkToGfm, getTextAndLink } from '../helpers/linkConvertHelper';
import { Context } from './context';

export abstract class AbstractConverter {
    protected references: Map<string, string[]>;

    public constructor(references: Map<string, string[]>) {
        this.references = references;
    }

    public convert(node: Node, context: Context): Array<YamlModel> {
        var models = this.generate(node, context) || [];
        for (const model of models) {
            model.summary = convertLinkToGfm(model.summary);
            model.package = context.PackageName;

            this.setSource(model, node, context);

            if (node.comment || node.signatures && node.signatures.length && node.signatures[0].comment) {
                this.setCustomModuleName(model, node.comment);

                const comment = node.comment ? node.comment : node.signatures[0].comment;
                this.setDeprecated(model, comment);
                this.setIsPreview(model, comment);
                this.setRemarks(model, comment);
                this.setInherits(model, comment);
            }
        }

        return models;
    }

    protected abstract generate(node: Node, context: Context): Array<YamlModel>;

    private setSource(model: YamlModel, node: Node, context: Context) {
        if (context.Repo && node.sources && node.sources.length) {
            model.source = {
                path: node.sources[0].fileName,
                // shift one line up as systematic off for TypeDoc
                startLine: node.sources[0].line,
                remote: {
                    path: `${context.Repo.basePath}\\${node.sources[0].fileName}`,
                    repo: context.Repo.repo,
                    branch: context.Repo.branch
                }
            };
        }
    }

    private setDeprecated(model: YamlModel, comment: Comment) {
        const deprecated = this.extractTextFromComment('deprecated', comment);
        if (deprecated != null) {
            model.deprecated = {
                content: convertLinkToGfm(deprecated)
            };
        }
    }

    private setIsPreview(model: YamlModel, comment: Comment) {
        const isPreview = this.extractTextFromComment('beta', comment);
        if (isPreview != null) {
            model.isPreview = true;
        }
    }

    private setRemarks(model: YamlModel, comment: Comment) {
        const remarks = this.extractTextFromComment('remarks', comment);
        if (remarks != null) {
            model.remarks = convertLinkToGfm(remarks);
        }
    }

    private setCustomModuleName(model: YamlModel, comment: Comment) {
        const customModuleName = this.extractTextFromComment('module', comment);
        if (customModuleName) {
            model.module = customModuleName;
        }
    }

    private setInherits(model: YamlModel, comment: Comment) {
        const inherits = this.extractTextFromComment('inherits', comment);
        if (inherits != null) {
            const tokens = getTextAndLink(inherits);
            if (tokens.length === 2) {
                model.extends = {
                    name: tokens[0],
                    href: tokens[1]
                };
            }
        }
    }

    private extractTextFromComment(infoName: string, comment: Comment): string {
        if (comment && comment.tags) {
            for (const tag of comment.tags) {
                if (tag.tag === infoName) {
                    return tag.text.trim();
                }
            }
        }

        return null;
    }

    protected getGenericType(typeParameters: ParameterType[]): string {
        if (typeParameters && typeParameters.length) {
            return `<${typeParameters[0].name}>`;
        }
        return '';
    }

    protected findDescriptionInComment(comment: Comment): string {
        if (!comment) {
            return '';
        }

        if (comment.tags) {
            let text: string = null;
            comment.tags.forEach(tag => {
                if (tag.tag === 'classdesc'
                    || tag.tag === 'description'
                    || tag.tag === 'exemptedapi'
                    || tag.tag === 'property') {
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

    protected extractType(type: ParameterType): Type[] {
        let result: Type[] = [];
        if (type === undefined) {
            return result;
        }
        if (type.type === 'union' && type.types && type.types.length) {
            if (this.hasCommonPrefix(type.types)) {
                result.push({
                    typeName: type.types[0].name.split('.')[0]
                });
            } else {
                result.push({
                    unionType: {
                        types: type.types.map(t => this.extractType(t)[0])
                    }
                });
            }
        } else if (type.type === 'array') {
            let newType = this.extractType(type.elementType);
            result.push({
                arrayType: newType[0]
            });
        } else if (type.type === 'intersection' && type.types.length) {
            result.push({
                intersectionType: {
                    types: type.types.map(t => this.extractType(t)[0])
                }
            });
        } else if (type.type === 'reflection' && type.declaration) {
            if (type.declaration.indexSignature) {
                let signatures = type.declaration.indexSignature;
                signatures.forEach(signature => {
                    result.push({
                        reflectedType: {
                            key: {
                                typeName: signature.parameters[0].type.name,
                                typeId: signature.parameters[0].type.id
                            },
                            value: {
                                typeName: signature.type.name,
                                typeId: signature.type.id
                            }
                        }
                    });
                });
            } else if (type.declaration.signatures && type.declaration.signatures.length) {
                result.push({
                    typeName: `${this.generateCallFunction('', this.fillParameters(type.declaration.signatures[0].parameters))} => ${typeToString(this.extractType(type.declaration.signatures[0].type)[0])}`
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
                    inner: type.typeArguments.map(t => this.extractType(t)[0])
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

    protected hasCommonPrefix(types: ParameterType[]): boolean {
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

    protected generateCallFunction(prefix: string, parameters: YamlParameter[], typeParameters?: ParameterType[]): string {
        if (parameters) {
            return `${prefix}${this.getGenericType(typeParameters)}(${parameters.map(p => `${p.id}${p.optional ? '?' : ''}: ${(typeToString(p.type[0]))}`).join(', ')})`;
        }
        return '';
    }

    protected fillParameters(parameters: Parameter[]): YamlParameter[] {
        if (parameters) {
            return parameters.map<YamlParameter>(p => {
                let description = '';
                if (p.comment) {
                    description = (p.comment.shortText && p.comment.shortText !== '') ? p.comment.shortText : p.comment.text;
                }
                return <YamlParameter>{
                    id: p.name,
                    type: this.extractType(p.type),
                    description: convertLinkToGfm(description),
                    optional: p.flags && p.flags.isOptional
                };
            });
        }
        return [];
    }

    protected extractReturnComment(comment: Comment): string {
        if (comment == null || comment.returns == null) {
            return '';
        }

        return comment.returns.trim();
    }

    protected extractInformationFromSignature(method: YamlModel, node: Node, signatureIndex: number) {
        if (node.signatures[signatureIndex].comment) {
            method.summary = this.findDescriptionInComment(node.signatures[signatureIndex].comment);
        }
        method.syntax.parameters = this.fillParameters(node.signatures[signatureIndex].parameters);

        if (node.signatures[signatureIndex].type && node.kindString !== 'Constructor' && node.signatures[signatureIndex].type.name !== 'void') {
            method.syntax.return = {
                type: this.extractType(node.signatures[signatureIndex].type),
                description: this.extractReturnComment(node.signatures[signatureIndex].comment)
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
            let functionBody = this.generateCallFunction(method.name, method.syntax.parameters, node.signatures[signatureIndex].typeParameter);
            method.syntax.content = `${node.flags && node.flags.isStatic ? 'static ' : ''}function ${functionBody}`;
            method.type = node.kindString.toLowerCase();
        } else {
            method.name = method.uid.split('.').reverse()[1];
            let functionBody = this.generateCallFunction(method.name, method.syntax.parameters);
            method.syntax.content = `new ${functionBody}`;
            method.type = 'constructor';
        }
    }

    protected composeMethodNameFromSignature(method: YamlModel, typeParameters?: ParameterType[]): string {
        let parameterType = method.syntax.parameters.map(p => {
            return typeToString(p.type[0]);
        }).join(', ');
        return method.name + this.getGenericType(typeParameters)  + '(' + parameterType + ')';
    }

    protected parseTypeArgumentsForTypeAlias(node: Node | ParameterType): string {
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

    protected parseTypeDeclarationForTypeAlias(typeInfo: ParameterType): string {
        switch (typeInfo.type) {
            case 'union':
                return this.parseUnionType(typeInfo);
            case 'tuple':
                return this.parseTupleType(typeInfo);
            case 'reflection':
                if (typeInfo.declaration) {
                    if (typeInfo.declaration.signatures && typeInfo.declaration.signatures.length) {
                        return this.parseFunctionType(typeInfo);
                    }
                    if (typeInfo.declaration.children) {
                        return this.parseUserDefinedType(typeInfo);
                    }
                    return 'Object';
                }
                break;
            case 'intersection':
                return this.parseIntersection(typeInfo);
            default:
                let content = 'Object';
                if (typeInfo.name) {
                    content = typeInfo.name;
                } else if (typeInfo.value) {
                    content = typeInfo.value;
                }
                if (typeInfo.typeArguments && typeInfo.typeArguments.length) {
                    content += this.parseTypeArgumentsForTypeAlias(typeInfo);
                }
                return content;
        }
    }

    protected parseUnionType(typeInfo: ParameterType): string {
        let content = '';
        if (typeInfo.types && typeInfo.types.length) {
            content = this.parseCommonTypeInfo(typeInfo, 'union', ' | ');
        }
        return content;
    }

    protected parseTupleType(typeInfo: ParameterType): string {
        let content = '';
        if (typeInfo.elements && typeInfo.elements.length) {
            content = this.parseCommonTypeInfo(typeInfo, 'tuple', ', ');
        }
        content = '[ ' + content + ' ]';
        return content;
    }

    protected parseIntersection(typeInfo: ParameterType): string {
        if (typeInfo.types && typeInfo.types.length) {
            return this.parseCommonTypeInfo(typeInfo, 'intersection', ' & ');
        }
        return '';
    }

    protected parseCommonTypeInfo(typeInfo: ParameterType, type: string, seperator: string): string {
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
            } else if (item.type === 'array' && item.elementType) {
                return `${item.elementType.name}[]`;
            }
            else {
                return this.parseUserDefinedType(item);
            }
        }).join(seperator);
        return content;
    }

    protected parseFunctionType(typeInfo: ParameterType): string {
        let typeResult = this.extractType(typeInfo);
        let content = '';
        if (typeResult.length) {
            content = typeResult[0].typeName;
        }
        return content;
    }

    protected parseUserDefinedType(typeInfo: ParameterType): string {
        if (!typeInfo.declaration || !typeInfo.declaration.children) {
            return '';
        }
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
                type = `${this.generateCallFunction(child.name, this.fillParameters(child.signatures[0].parameters))} => ${typeToString(this.extractType(child.signatures[0].type)[0])}`;
            }
            return type;

        }).join(', ');
        content = '{ ' + content + ' }';
        return content;
    }

}