import { YamlModel } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';

export function tocGenerator(classes: Array<YamlModel>): Array<TocItem> {
    let result: Array<TocItem> = [];
    if (classes) {
        classes.forEach(classModel => {
            let firstLevelToc: TocItem = {
                uid: classModel.uid,
                name: classModel.name
            };
            if (classModel.children) {
                let items: Array<TocItem> = [];
                (classModel.children as Array<YamlModel>).forEach(method => {
                    if (method.name !== 'constructor') {
                        items.push({
                            uid: method.uid,
                            name: method.name
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
