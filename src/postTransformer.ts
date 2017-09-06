import { YamlModel, Root } from './interfaces/YamlModel';
import { globalUid, constructorName } from './common/constants';

export function postTransform(element: YamlModel): Root {
    let result: YamlModel[] = [element];
    if (element.children) {
        let childrenUid: string[] = [];
        (element.children as YamlModel[]).sort(sortYamlModel).forEach(child => {
            childrenUid.push(child.uid);
            result.push(child);
        });

        element.children = childrenUid;
    }
    return {
        items: result
    };
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
