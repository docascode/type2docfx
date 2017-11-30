import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';
import { flags } from './common/flags';
import { globalName } from './common/constants';

export function generateToc(elements: YamlModel[], packageUid: string): TocItem[] {
    let result: TocItem[] = [];
    let previousUid: string = null;
    if (elements) {
        let tocs = elements;
        if (flags.enableAlphabetOrder) {
            tocs  = elements.sort(sortToc);
        }
        let dictModuleName: { [key: string]: TocItem } = {};
        tocs.forEach(element => {
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
                    name: element.name.split('(')[0],
                    items: getFunctionLevelToc(element)
                };

                if (!dictModuleName[element.module]) {
                    dictModuleName[element.module] = {
                        uid: `${element.package}.${element.module.replace(/\//g, '.')}`,
                        name: element.module,
                        items: []
                    };
                    result.push(dictModuleName[element.module]);
                }
                dictModuleName[element.module].items.push(secondLevelToc);
            } else {
                result.push({
                    uid: element.uid,
                    name: element.name.split('(')[0],
                    items: getFunctionLevelToc(element)
                });
            }

        });
    }
    return [{
        uid: packageUid,
        name: packageUid,
        items: result
    }];
}

function getFunctionLevelToc(element: YamlModel): TocItem[] {
    let result: TocItem[] = [];
    if (flags.enableFunctionLevelToc) {
        let children = element.children as string[];
        if (element.name === globalName && children) {
            children.forEach(child => {
                let tmp = child.split('.');
                result.push({
                    uid: child,
                    name: tmp[tmp.length - 1].split('(')[0]
                });
            });
        }
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
