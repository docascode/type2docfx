import { YamlModel, Root } from './interfaces/YamlModel';
import { globalUid, constructorName } from './common/constants';
import { flags } from './common/flags';

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

      // sort classes alphabetically, but GLOBAL at last, contructor first
      if (a.uid === globalUid || b.name === constructorName) {
        return 1;
      }
      if (b.uid === globalUid || a.name === constructorName) {
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
