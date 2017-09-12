import { YamlModel, Root } from './interfaces/YamlModel';
import { globalUid, constructorName } from './common/constants';
import { flags } from './common/flags';

export function postTransform(element: YamlModel): Root {
    let result: YamlModel[] = [element];
    flattening(element, result);
    return {
        items: result
    };
}

function flattening(element: YamlModel, items: YamlModel[]) {
  if (element.children) {
    let childrenUid: string[] = [];
    let children = element.children as YamlModel[];
    if (flags.enableAlphabetOrder) {
      children = children.sort(sortYamlModel);
    }
    children.forEach(child => {
        childrenUid.push(child.uid);
        items.push(child);
        flattening(child, items);
    });

    element.children = childrenUid;
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
