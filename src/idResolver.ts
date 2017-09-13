import { YamlModel, Type, Types } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';

export function resolveIds(elements: YamlModel[], uidMapping: UidMapping): void {
    if (elements) {
        elements.forEach(element => {
            if (element.syntax) {
                if (element.syntax.parameters) {
                    element.syntax.parameters.forEach(p => {
                        p.type = restoreTypes(p.type, uidMapping);
                    });
                }

                if (element.syntax.return) {
                    element.syntax.return.type = restoreTypes(element.syntax.return.type, uidMapping);
                }
            }
            if (element.extends) {
                element.extends = restoreTypes(element.extends, uidMapping);
            }
            resolveIds(element.children as YamlModel[], uidMapping);
        });
    }
}

function restoreTypes(types: Types, uidMapping: UidMapping): string[] {
    if (types) {
        return (types as any[]).map(t => {
            if (typeof(t) === 'string') {
                return t;
            }

            if (t.reflectedType) {
                return typeToString(t);
            } else if (t.genericType) {
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
        let t = type.split('.');
        return t[t.length - 1];
    }

    if (type.isArray) {
        let newType = type;
        newType.isArray = false;
        return `${typeToString(newType)}[]`;
    }

    if (type.reflectedType) {
        return `[key: ${typeToString(type.reflectedType.key)}]: ${typeToString(type.reflectedType.value)}`;
    } else if (type.genericType) {
        return `${typeToString(type.genericType.outter)}<${typeToString(type.genericType.inner)}>`;
    } else {
        return typeToString(type.typeName);
    }
}
