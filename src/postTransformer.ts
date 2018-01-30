import { YamlModel, Root } from './interfaces/YamlModel';
import { constructorName } from './common/constants';
import { flags } from './common/flags';

export function groupOrphanFunctions(elements: YamlModel[]): { [key: string]: YamlModel[] } {
  if (elements && elements.length) {
    let mapping: { [key: string]: YamlModel[] } = {};
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type === 'function') {
        let key;
        if (elements[i].module) {
          key = elements[i].module;
        } else {
          key = 'ParentToPackage';
          let tmp = elements[i].uid.split('.');
          tmp.splice(tmp.length - 1, 0, 'global');
          elements[i].uid = tmp.join('.');
        }
        if (!mapping[key]) {
          mapping[key] = [];
        }
        mapping[key].push(elements[i]);
        elements.splice(i, 1);
        i--;
      }
    }
    return mapping;
  }
}

export function insertFunctionToIndex(index: Root, functions: YamlModel[]) {
  if (index && functions) {
    index.items[0].children = (index.items[0].children as string[]).concat(functions.map(f => f.uid));
    index.items = index.items.concat(functions);
  }
}

export function postTransform(element: YamlModel): Root[] {
    return flattening(element);
}

function flattening(element: YamlModel): Root[] {
  if (!element) {
    return [];
  }
  let result: Root[] = [];
  result.push({
    items: [element]
  });
  if (element.children) {
    let childrenUid: string[] = [];
    let children = element.children as YamlModel[];
    if (flags.enableAlphabetOrder) {
      children = children.sort(sortYamlModel);
    }
    children.forEach(child => {
        if (child.children && child.children.length > 0) {
          result = result.concat(flattening(child));
        } else {
          childrenUid.push(child.uid);
          result[0].items.push(child);
        }
    });

    element.children = childrenUid;
    return result;
  }
}

function sortYamlModel(a: YamlModel, b: YamlModel): number {
      if (a.numericValue !== undefined && b.numericValue !== undefined) {
        return a.numericValue - b.numericValue;
      }

      // sort classes alphabetically, contructor first
      if (b.name === constructorName) {
        return 1;
      }
      if (a.name === constructorName) {
        return -1;
      }

      let nameA = a.name.toUpperCase();
      let nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      return 0;
}
