import { YamlModel, Root } from "../interfaces/YamlModel";
import { PackageYamlModel, FieldYamlModel } from "../interfaces/SDPYamlModel";
import {
  EnumYamlModel,
  TypeAliasYamlModel,
  TypeYamlModel,
  FunctionYamlModel,
  CommonYamlModel,
} from "../interfaces/SDPYamlModel";

export function mergeElementsToPackageSDP(
  elements: YamlModel[]
): PackageYamlModel {
  let packageModel: PackageYamlModel = null;
  if (elements && elements.length) {
    packageModel = {
      uid: null,
      name: null,
      summary: "",
      type: "package",
    };

    elements.forEach((element) => {
      switch (element.type) {
        case "class":
          if (!packageModel.classes) {
            packageModel.classes = [];
          }
          packageModel.classes.push(element.uid);
          break;
        case "interface":
          if (!packageModel.interfaces) {
            packageModel.interfaces = [];
          }
          packageModel.interfaces.push(element.uid);
          break;
        case "enum":
          if (!packageModel.enums) {
            packageModel.enums = [];
          }
          packageModel.enums.push(element.uid);
          break;
        case "type alias":
          if (!packageModel.typeAliases) {
            packageModel.typeAliases = [];
          }
          packageModel.typeAliases.push(element.uid);
          break;
        case "function":
          if (!packageModel.functions) {
            packageModel.functions = [];
          }
          packageModel.functions.push(convertToFunctionSDP(element));
          break;
        default:
          console.log("[warning] not applied type(package): ", element.type);
      }
      // (packageModel.children as string[]).push(element.uid);
      if (!packageModel.uid && element.package) {
        packageModel.uid = element.package;
        packageModel.name = element.package;
      }
    });
  }

  return packageModel;
}

function convertToModule(
  transfomredClass: Root,
  baseModel?: PackageYamlModel
): PackageYamlModel {
  const item = transfomredClass.items[0];
  const module: PackageYamlModel = {
    ...baseModel,
    uid: item.uid,
    name: item.name,
    type: "module",
    package: item.package,
    summary: item.summary,
  };
  // 把自己的sub items加到对应的类型里
  for (let i = 1; i < transfomredClass.items.length; i++) {
    const ele = transfomredClass.items[i];
    switch (ele.type) {
      case "property":
        if (!module.properties) {
          module.properties = [];
        }
        module.properties.push(convertToFunctionSDP(ele));
        break;
      case "function":
        if (!module.functions) {
          module.functions = [];
        }
        module.functions.push(convertToFunctionSDP(ele));
        break;
      default:
        console.log("[warning] not applied type(module): ", ele.type);
    }
  }

  return module;
}

export function convertToSDP(
  transfomredClass: Root,
  allTransfomredClasses: Root[]
): { model: CommonYamlModel; type: string } | undefined {
  const element = transfomredClass.items[0];
  switch (element.type) {
    case "class":
    case "interface":
      return {
        model: convertToTypeSDP(transfomredClass, element.type === "class"),
        type: "Type",
      };
    case "enum":
      if (transfomredClass.items.length < 2) {
        console.log(`[warning] enum ${element.uid}/${element.name} does not have fields`);
        return undefined;
      }
      return { model: convertToEnumSDP(transfomredClass), type: "Enum" };
    case "type alias":
      return { model: convertToTypeAliasSDP(element), type: "TypeAlias" };
    case "module":
      const moduleChildren: YamlModel[] = [];
      allTransfomredClasses
        .filter((value) => {
          const uid = value.items[0].uid;
          return (element.children as Array<string>).indexOf(uid) !== -1;
        })
        .forEach((item) => {
          moduleChildren.push(item.items[0]);
        });
      return {
        model: convertToModule(
          transfomredClass,
          mergeElementsToPackageSDP(moduleChildren)
        ),
        type: "Package",
      };
    default:
      console.log("not applied type: ", element.type);
      return undefined;
  }
}

function convertToEnumSDP(transfomredClass: Root): EnumYamlModel {
  const element = transfomredClass.items[0];
  const fields = [];
  for (let i = 1; i < transfomredClass.items.length; i++) {
    const ele = transfomredClass.items[i];
    const field: FieldYamlModel = {
      name: ele.name,
      uid: ele.uid,
      package: ele.package,
      summary: ele.summary,
    };

    if (ele.numericValue !== null && !isNaN(ele.numericValue)) {
      field.numericValue = ele.numericValue;
    }
    fields.push(field);
  }

  const result: EnumYamlModel = {
    ...convertCommonYamlModel(element),
    fields: fields,
  };
  return result;
}

function convertToTypeAliasSDP(element: YamlModel): TypeAliasYamlModel {
  return {
    ...convertCommonYamlModel(element),
    syntax: element.syntax.content,
  };
}

export function convertToTypeSDP(
  transfomredClass: Root,
  isClass: boolean
): TypeYamlModel {
  const element = transfomredClass.items[0];
  const constructors = [];
  const properties = [];
  const methods = [];
  for (let i = 1; i < transfomredClass.items.length; i++) {
    const ele = transfomredClass.items[i];
    const item = convertCommonYamlModel(ele);
    if (ele.type === "constructor") {
      // interface不需要此字段
      isClass && constructors.push(item);
    } else if (ele.type === "property") {
      properties.push(item);
    } else if (ele.type === "method") {
      methods.push(item);
    } else {
      console.log(`[warning] ${ele.uid}#${ele.name} is not applied sub type ${ele.type} for type yaml`
      );
    }
  }
  const result: TypeYamlModel = {
    ...convertCommonYamlModel(element),
    type: isClass ? "class" : "interface",
  };
  if (constructors.length > 0) {
    result.constructors = constructors;
  }

  if (properties.length > 0) {
    result.properties = properties;
  }

  if (methods.length > 0) {
    result.methods = methods;
  }

  if (element.extends) {
    result.extends = convertSelfTypeToXref(element.extends.name as string);
  }
  return result;
}

function convertToFunctionSDP(element: YamlModel): FunctionYamlModel {
  const model = convertCommonYamlModel(element);
  // don't need these fields
  delete model.fullName;
  return model;
}

function convertCommonYamlModel(element: YamlModel): CommonYamlModel {
  const result: CommonYamlModel = {
    name: element.name,
    uid: element.uid,
    package: element.package,
    summary: element.summary,
  };

  if (element.fullName) {
    result.fullName = element.fullName;
  }

  // because mustache meet same variable in different level
  // such as: { "pre": true, "list": [{}]}
  // if item in list wants to use pre but the pre is not assigned, it will use outer pre field.
  // so, there need to set below variable explict

  if (element.remarks) {
    result.remarks = element.remarks;
  } else {
    result.remarks = "";
  }

  result.isPreview = element.isPreview;
  if (!result.isPreview) {
    result.isPreview = false;
  }

  if (element.deprecated) {
    result.isDeprecated = true;
    result.customDeprecatedMessage = element.deprecated.content;
  } else {
    result.isDeprecated = false;
  }

  if (element.syntax) {
    result.syntax = {};

    const syntax = element.syntax;
    result.syntax.content = syntax.content;
    if (syntax.parameters && syntax.parameters.length > 0) {
      syntax.parameters?.forEach((it) => {
        delete it.optional;
      });
      // type(return, parameters)根据是否是自己的类修改成xref语法的值
      result.syntax.parameters = syntax.parameters.map((it) => {
        return {
          ...it,
          type: convertSelfTypeToXref(escapeMarkdown(it.type[0] as string)),
        };
      });
    }

    if (syntax.return) {
      result.syntax.return = {
        ...syntax.return,
        type: convertSelfTypeToXref(
          escapeMarkdown(syntax.return.type[0] as string)
        ),
      };
    }
  }

  return result;
}

function escapeMarkdown(name: string): string {
  // eg: [key: string]: string
  const markdownLinkRegEx = /^\s*(\[.+\]):(.+)/g;
  return name.replace(markdownLinkRegEx, `$1\\:$2`);
}

function convertSelfTypeToXref(name: string): string {
  let result = name;
  // parse < >
  result = result.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const uidRegEx = /(@?[\w\d\-/]+\.[\w\d\-\./]+)/g;

  return result.replace(uidRegEx, `<xref uid="$1" />`);
}
