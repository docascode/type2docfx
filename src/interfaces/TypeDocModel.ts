export interface Node {
    id: number;
    name: string;
    kind: number;
    kindString: string;
    children: Array<Node>;
    flags: Flags;
    comment: Comment;
    signatures: Array<Signature>;
    type: ParameterType;
    defaultValue: string;
}

interface Flags {
    isExported: boolean;
    isPrivate: boolean;
}

export interface Comment {
    text?: string;
    shortText?: string;
    tags?: Array<Tag>;
}

export interface Tag {
    tag: string;
    text: string;
    param: string;
}

interface Signature {
    comment: Comment;
    parameters: Array<Parameter>;
    type?: ParameterType;
}

export interface Parameter {
    name: string;
    type: ParameterType;
    comment: Comment;
    flags: ParameterFlag;
}

interface ParameterType {
    type: string;
    name: string;
    id: number;
}

interface ParameterFlag {
    isOptional: boolean;
}
