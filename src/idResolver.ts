import { YamlModel } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';

export function resolveIds(elements: Array<YamlModel>, uidMapping: UidMapping): void {
    if (elements) {
        elements.forEach(element => {
            (element.children as Array<YamlModel>).forEach(child => {
                if (child.syntax) {
                    if (child.syntax.parameters) {
                        child.syntax.parameters.forEach(p => {
                            if (uidMapping[p.typeId]) {
                                p.id = uidMapping[p.typeId];
                            }
                            p.typeId = undefined;
                        });
                    }

                    if (child.syntax.return) {
                        if (uidMapping[child.syntax.return.typeId]) {
                            child.syntax.return.type[0] = uidMapping[child.syntax.return.typeId];
                        }
                        child.syntax.return.typeId = undefined;
                    }
                }
            });
        });
    }
}
