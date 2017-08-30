import { YamlModel, Root } from './interfaces/YamlModel';
import { globalUid } from './common/constants';

export function postTransform(classModel: YamlModel): Root {
    let result: Array<YamlModel> = [classModel];
    if (classModel.children) {
        let childrenUid: Array<string> = [];
        (classModel.children as Array<YamlModel>).sort(sortYamlModel).forEach(method => {
            childrenUid.push(method.uid);
            result.push(method);
        });

        classModel.children = childrenUid;
    }
    return {
        items: result
    };
}

function sortYamlModel(a: YamlModel, b: YamlModel): number {
      // sort classes alphabetically, but GLOBAL at last
      if (a.uid === globalUid) {
        return 1;
      }
      if (b.uid === globalUid) {
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
