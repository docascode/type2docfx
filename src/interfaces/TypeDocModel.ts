export interface Node {
    name: string;
    kind: number;
    kindString: string;
    children: Array<Node>;
    flags: Flags;
    comment: Comment;
    signatures: Array<Signature>;
}

interface Flags {
    isExported: boolean;
    isPrivate: boolean;
}

interface Comment {
    text?: string;
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
}

interface ParameterType {
    type: string;
    name: string;
}
