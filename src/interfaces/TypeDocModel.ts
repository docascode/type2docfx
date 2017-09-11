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
    parameters: Array<Parameter>;
    indexSignature: Array<Node>;
    extendedTypes: Array<ParameterType>;
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

export interface ParameterType {
    type: string;
    types: Array<ParameterType>;
    name: string;
    id: number;
    typeArguments: Array<ParameterType>;
    declaration: Node;
    elementType: ParameterType;
}

interface ParameterFlag {
    isOptional: boolean;
}
