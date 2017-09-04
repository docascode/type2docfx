import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';

export function tocGenerator(elements: Array<YamlModel>): Array<TocItem> {
    let result: Array<TocItem> = [];
    if (elements) {
        elements.forEach(element => {
            if (element.uid.indexOf('constructor') >= 0) {
                return;
            }
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
