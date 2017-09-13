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
    source?: Source;
    extends?: Types;
    deprecated?: Deprecated;
}

export type Types = Array<Type> | Array<string>;

interface Deprecated {
    content: string;
}

interface Source {
    path: string;
    startLine: number;
    remote: Remote;
}

interface Remote {
    path: string;
    branch: string;
    repo: string;
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
    type: Types;
}

export interface YamlParameter {
    id: string;
    type: Types;
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
    isArray?: boolean;
}

interface GenericType {
    outter: Type;
    inner: Type;
}

interface ReflectedType {
    key: Type;
    value: Type;
}

export interface Exception {
    type: string;
    description: string;
}
