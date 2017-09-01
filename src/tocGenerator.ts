import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';

export function tocGenerator(classes: Array<YamlModel>): Array<TocItem> {
    let result: Array<TocItem> = [];
    if (classes) {
        classes.forEach(classModel => {
            if (classModel.uid.indexOf('constructor') >= 0) {
                return;
            }
            let firstLevelToc: TocItem = {
                uid: classModel.uid,
                name: classModel.name.split('(')[0]
            };
            if (classModel.children) {
                let items: Array<TocItem> = [];
                (classModel.children as Array<YamlModel>).forEach(method => {
                    if (method.name !== 'constructor') {
                        items.push({
                            uid: method.uid,
                            name: method.name.split('(')[0]
                        });
                    }

                });
                firstLevelToc.items = items;
            }
            result.push(firstLevelToc);
        });
    }
    return result;
}
