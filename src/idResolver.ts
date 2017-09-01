import { YamlModel } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';

export function resolveIds(classes: Array<YamlModel>, uidMapping: UidMapping): void {
    if (classes) {
        classes.forEach(classItem => {
            (classItem.children as Array<YamlModel>).forEach(method => {
                if (method.syntax) {
                    if (method.syntax.parameters) {
                        method.syntax.parameters.forEach(p => {
                            if (uidMapping[p.typeId]) {
                                p.id = uidMapping[p.typeId];
                            }
                            p.typeId = undefined;
                        });
                    }

                    if (method.syntax.return) {
                        if (uidMapping[method.syntax.return.typeId]) {
                            method.syntax.return.type[0] = uidMapping[method.syntax.return.typeId];
                        }
                        method.syntax.return.typeId = undefined;
                    }
                }
            });
        });
    }
}
