export interface Node {
    id: number;
    name: string;
    kind: number;
    kindString: string;
    children: Node[];
    flags: Flags;
    comment: Comment;
    signatures: Signature[];
    type: ParameterType;
    defaultValue: string;
    parameters: Parameter[];
    indexSignature: Node[];
    extendedTypes: ParameterType[];
    inheritedFrom: ParameterType;
    sources: Source[];
    typeParameter: ParameterType[];
    getSignature: Node[];
    setSignature: Node[];
}

interface Source {
    fileName: string;
    line: number;
}

interface Flags {
    isExported: boolean;
    isPrivate: boolean;
    isProtected: boolean;
    isStatic: boolean;
}

export interface Comment {
    text?: string;
    shortText?: string;
    tags?: Tag[];
}

export interface Tag {
    tag: string;
    text: string;
    param: string;
}

export interface Signature {
    comment: Comment;
    parameters: Parameter[];
    type?: ParameterType;
    typeParameter: ParameterType[];
}

export interface Parameter {
    name: string;
    type: ParameterType;
    comment: Comment;
    flags: ParameterFlag;
}

export interface ParameterType {
    type: string;
    types: ParameterType[];
    name: string;
    id: number;
    typeArguments: ParameterType[];
    declaration: Node;
    elementType: ParameterType;
}

interface ParameterFlag {
    isOptional: boolean;
}
