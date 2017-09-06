export interface YamlModel {
    uid: string;
    name: string;
    children: Array<YamlModel> | Array<string>;
    langs: Array<string>;
    type?: string;
    summary?: string;
    syntax?: Syntax;
    fullName?: string;
    exceptions?: Array<Exception>;
    numericValue?: number;
    package?: string;
    module?: string;
}

interface Reference {
    uid: string;
    name: string;
}

export interface Syntax {
    parameters?: Array<YamlParameter>;
    content?: string;
    return?: Return;
}

interface Return {
    type: Array<Type> | Array<string>;
}

export interface YamlParameter {
    id: string;
    type: Array<Type> | Array<string>;
    description: string;
    optional?: boolean;
}

export interface Root {
    items: Array<YamlModel>;
    references?: Array<Reference>;
}

export interface Type {
    typeName?: string;
    typeId?: number;
    reflectedType?: ReflectedType;
    genericType?: GenericType;
}

interface GenericType {

}

interface ReflectedType {
    key: Type;
    value: Type;
}

export interface Exception {
    type: string;
    description: string;
}
