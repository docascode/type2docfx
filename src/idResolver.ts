import { YamlModel, Type } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';

export function resolveIds(elements: Array<YamlModel>, uidMapping: UidMapping): void {
    if (elements) {
        elements.forEach(element => {
            (element.children as Array<YamlModel>).forEach(child => {
                if (child.syntax) {
                    if (child.syntax.parameters) {
                        child.syntax.parameters.forEach(p => {
                            p.type = restoreTypes(p.type as Array<Type>, uidMapping);
                        });
                    }

                    if (child.syntax.return) {
                        child.syntax.return.type = restoreTypes(child.syntax.return.type as Array<Type>, uidMapping);
                    }
                }
            });
        });
    }
}

function restoreTypes(types: Array<Type>, uidMapping: UidMapping): Array<string> {
    if (types) {
        return types.map(t => {
            if (t.reflectedType) {
                return typeToString(t);
            } else {
                if (t.typeId && uidMapping[t.typeId]) {
                    return uidMapping[t.typeId];
                } else {
                    return t.typeName;
                }
            }
        });
    }
    return null;
}

export function typeToString(type: Type | string): string {
    if (!type) {
        return 'function';
    }

    if (typeof(type) === 'string') {
        return type;
    }

    if (type.reflectedType) {
        return `[key: ${type.reflectedType.key.typeName}]: ${type.reflectedType.value.typeName}`;
    } else {
        return type.typeName;
    }
}
