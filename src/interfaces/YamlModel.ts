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
}

export interface Syntax {
    parameters: Array<YamlParameter>;
    content: string;
    return?: Type;
}

export interface YamlParameter {
    id: string;
    type: Array<string>;
    description: string;
}

export interface Root {
    items: Array<YamlModel>;
}

interface Type {
    type: Array<string>;
}

interface Exception {
    type: string;
    description: string;
}
