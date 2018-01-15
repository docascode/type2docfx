import { YamlModel, Root } from './interfaces/YamlModel';
import { TocItem } from './interfaces/TocItem';

export function generateModules(tocRoots: TocItem[]): Root[] {
    let result: Root[] = [];

    tocRoots.forEach(tocRoot => {
        let root: Root = {
            items: [],
            references: []
        };
        let moduleModel: YamlModel = {
            uid: tocRoot.uid,
            name: tocRoot.name,
            summary: '',
            langs: [ 'typeScript' ],
            type: 'module',
            children: []
        };

        tocRoot.items.forEach(item => {
            (moduleModel.children as string[]).push(item.uid);
            root.references.push({
                uid: item.uid,
                name: item.name
            });
        });

        root.items.push(moduleModel);
        result.push(root);
    });

    return result;
}
