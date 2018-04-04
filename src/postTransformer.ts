import { YamlModel, Root, Reference } from './interfaces/YamlModel';
import { constructorName } from './common/constants';
import { uidRegex } from './common/regex';
import { flags } from './common/flags';
import { ReferenceMapping } from './interfaces/ReferenceMapping';

export function groupOrphanFunctions(elements: YamlModel[]): { [key: string]: YamlModel[] } {
  if (elements && elements.length) {
    let mapping: { [key: string]: YamlModel[] } = {};
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type === 'function') {
        let key = elements[i].module ? elements[i].module : 'ParentToPackage';
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

export function postTransform(element: YamlModel, references: ReferenceMapping): Root[] {
    let roots = flattening(element);
    roots.forEach(root => {
      insertReferences(root, references);
    });

    return roots;
}

function insertReferences(root: Root, references: ReferenceMapping): void {
  root.references = [];
  for (let key in references) {
    let reference: Reference = {
      uid: key,
      'spec.typeScript': []
    };

    let match;
    let lastIndex = 0;
    while ((match = uidRegex.exec(references[key])) !== null) {
      if (uidRegex.lastIndex < match.index) {
        reference['spec.typeScript'].push({
          fullName: references[key].substring(uidRegex.lastIndex, match.index)
        });
      }
      lastIndex = match.index + match[0].length;
      reference['spec.typeScript'].push({
        uid: match[1],
        name: getItemName(match[1])
      });
    }

    if (lastIndex < references[key].length) {
      reference['spec.typeScript'].push({
        fullName: references[key].substring(lastIndex)
      });
    }

    root.references.push(reference);
  }
}

function getItemName(uid: string): string {
  let tmp = uid.split('.');
  return tmp[tmp.length - 1];
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
