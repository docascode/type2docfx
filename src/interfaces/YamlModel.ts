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
}

export interface Syntax {
    parameters?: Array<YamlParameter>;
    content?: string;
    return?: Type;
}

export interface YamlParameter {
    id: string;
    typeId?: number;
    type: Array<string>;
    description: string;
    optional?: boolean;
}

export interface Root {
    items: Array<YamlModel>;
}

interface Type {
    type: Array<string>;
    typeId?: number;
}

export interface Exception {
    type: string;
    description: string;
}
