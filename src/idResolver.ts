import { YamlModel, Type, Types, GenericType, ReflectedType } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';
import { typePlaceHolder } from './common/constants';

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
                    if (element.type === 'property' && element.syntax.content) {
                        element.syntax.content = element.syntax.content.replace(typePlaceHolder, element.syntax.return.type[0]);
                    }
                }
            }
            if (element.extends) {
                element.extends.name = restoreTypes([element.extends.name as Type], uidMapping)[0];
            }
            resolveIds(element.children as YamlModel[], uidMapping);
        });
    }
}

function restoreTypes(types: Types, uidMapping: UidMapping): string[] {
    if (types) {
        return (types as any[]).map(t => restoreType(t, uidMapping));
    }
    return null;
}

function restoreType(type: Type | string, uidMapping: UidMapping): string {
    if (typeof(type) === 'string') {
        return type;
    }

    if (type.reflectedType) {
        type.reflectedType.key = restoreType(type.reflectedType.key, uidMapping);
        type.reflectedType.value = restoreType(type.reflectedType.value, uidMapping);
    } else if (type.genericType) {
        type.genericType.inner = restoreType(type.genericType.inner, uidMapping);
        type.genericType.outter = restoreType(type.genericType.outter, uidMapping);
    } else {
        if (type.typeId && uidMapping[type.typeId]) {
            type.typeName = `@${uidMapping[type.typeId]}`;
        }
    }

    return typeToString(type);
}

export function typeToString(type: Type | string): string {
    if (!type) {
        return 'function';
    }

    if (typeof(type) === 'string') {
        if (type[0] === '@') {
            return type;
        } else {
            let t = type.split('.');
            return t[t.length - 1];
        }
    }

    if (type.isArray) {
        type.isArray = false;
        let result =  `${typeToString(type)}[]`;
        type.isArray = true;
        return result;
    }

    if (type.reflectedType) {
        return `[key: ${typeToString(type.reflectedType.key)}]: ${typeToString(type.reflectedType.value)}`;
    } else if (type.genericType) {
        return `${typeToString(type.genericType.outter)}<${typeToString(type.genericType.inner)}>`;
    } else {
        return typeToString(type.typeName);
    }
}
