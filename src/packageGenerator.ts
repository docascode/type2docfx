import { YamlModel, Root } from './interfaces/YamlModel';

export function generatePackage(elements: Array<YamlModel>): Root {
    let root: Root = {
        items: [],
        references: []
    };
    let packageModel: YamlModel = null;
    if (elements && elements.length) {
        packageModel = {
            uid: elements[0].package,
            name: elements[0].package,
            summary: '',
            children: [],
            type: 'package',
            langs: [ 'typeScript' ]
        };

        elements.forEach(element => {
            root.references.push({
                uid: element.uid,
                name: element.name
            });
            (packageModel.children as Array<string>).push(element.uid);
        });
    }
    root.items.push(packageModel);
    return root;
}
