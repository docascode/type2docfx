import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';

export function tocGenerator(elements: Array<YamlModel>): Array<TocItem> {
    let result: Array<TocItem> = [];
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
            let firstLevelToc: TocItem = {
                uid: element.uid,
                name: element.name.split('(')[0]
            };
            /*
            if (element.children) {
                let items: Array<TocItem> = [];
                (element.children as Array<YamlModel>).forEach(method => {
                    if (method.name !== 'constructor') {
                        items.push({
                            uid: method.uid,
                            name: method.name.split('(')[0]
                        });
                    }

                });
                firstLevelToc.items = items;
            }
            */
            result.push(firstLevelToc);
        });
    }
    return result;
}

function sortToc(a: YamlModel, b: YamlModel) {
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
