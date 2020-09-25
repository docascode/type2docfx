
type BaseYamlModel = {
  uid: string;
  name: string;
  package?: string;
  summary?: string;
}

export type CommonYamlModel = BaseYamlModel & {
  syntax?: Syntax;
  fullName?: string;
  isPreview?: boolean;
  isDeprecated?: boolean;
  remarks?: string;
  customDeprecatedMessage?: string;
}

export type PackageYamlModel = CommonYamlModel & {
  classes?: Array<string>;
  interfaces?: Array<string>;
  enums?: Array<string>;
  typeAliases?: Array<string>;
  properties?: Array<FunctionYamlModel>;
  type?: "package" | "module";
  functions?: Array<FunctionYamlModel>
}

export type FunctionYamlModel = CommonYamlModel

export type TypeAliasYamlModel = CommonYamlModel & {
  syntax: string;
}

export type TypeYamlModel = CommonYamlModel & {
  constructors?: Array<FunctionYamlModel>;
  properties?: Array<FunctionYamlModel>;
  methods?: Array<FunctionYamlModel>;
  type: "class" | "interface";
  extends?: Type | string;
}

export type EnumYamlModel = CommonYamlModel & {
  fields: Array<FieldYamlModel>
}

export type FieldYamlModel = BaseYamlModel & {
  numericValue?: number;
}

export type Syntax = {
  parameters?: Array<YamlParameter>;
  content?: string;
  return?: Return;
}

export type YamlParameter = {
  id: string;
  type: Type | string;
  description?: string;
}

type Return = {
  type: Type | string;
  description: string;
}

export type Type = {
  typeName?: string;
  typeId?: number;
  reflectedType?: ReflectedType;
  genericType?: GenericType;
  intersectionType?: IntersectionType;
  unionType?: UnionType;
  arrayType?: Type | string;
}

export type UnionType = {
  types: Types;
}

export type IntersectionType = {
  types: Types;
}

export type GenericType = {
  outter: Type | string;
  inner: Types;
}

export type ReflectedType = {
  key: Type | string;
  value: Type | string;
}

export type Exception = {
  type: string;
  description: string;
}

type Types = Type[] | string[];