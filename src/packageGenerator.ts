import { YamlModel, Root } from './interfaces/YamlModel';

export function generatePackage(elements: YamlModel[]): Root {
    let root: Root = {
        items: [],
        references: []
    };
    let packageModel: YamlModel = null;
    if (elements && elements.length) {
        packageModel = {
            uid: null,
            name: null,
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
            (packageModel.children as string[]).push(element.uid);
            if (!packageModel.uid && element.package) {
                packageModel.uid = element.package;
                packageModel.name = element.package;
            }
        });
    }
    root.items.push(packageModel);
    return root;
}
