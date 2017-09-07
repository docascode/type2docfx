import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';
import { flags } from './common/flags';

export function generateToc(elements: YamlModel[]): TocItem[] {
    let result: TocItem[] = [];
    let previousUid: string = null;
    if (elements) {
        elements.sort(sortToc).forEach(element => {
            if (element.uid.indexOf('constructor') >= 0) {
                return;
            }
            if (element.uid === previousUid) {
                return;
            }
            previousUid = element.uid;

            if (flags.hasModule) {
                let secondLevelToc: TocItem = {
                    uid: element.uid,
                    name: element.name.split('(')[0]
                };

                if (result.length === 0 || result[result.length - 1].name !== element.module) {
                    result.push({
                        uid: `${element.package}.${element.module.replace(/\//g, '.')}`,
                        name: element.module,
                        items: []
                    });
                }
                result[result.length - 1].items.push(secondLevelToc);
            } else {
                result.push({
                    uid: element.uid,
                    name: element.name.split('(')[0]
                });
            }
        });
    }
    return result;
}

function sortToc(a: YamlModel, b: YamlModel) {
    if (!a.module && b.module) {
        return 1;
    }

    if (a.module && !b.module) {
        return -1;
    }

    if (a.module && b.module) {
        let moduleNameA = a.module.toUpperCase();
        let moduleNameB = b.module.toUpperCase();
        if (moduleNameA < moduleNameB) {
          return -1;
        }
        if (moduleNameA > moduleNameB) {
          return 1;
        }
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
