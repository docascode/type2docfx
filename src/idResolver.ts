import { YamlModel, Type, Types, GenericType, ReflectedType } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';
import { ReferenceMapping } from './interfaces/ReferenceMapping';
import { uidRegex } from './common/regex';

export function resolveIds(element: YamlModel, uidMapping: UidMapping, referenceMapping: ReferenceMapping): void {
    if (element.syntax) {
        if (element.syntax.parameters) {
            element.syntax.parameters.forEach(p => {
                p.type = restoreReferences(p.type, uidMapping, referenceMapping);
            });
        }

        if (element.syntax.return) {
            element.syntax.return.type = restoreReferences(element.syntax.return.type, uidMapping, referenceMapping);
        }
    }
    if (element.extends) {
        element.extends.name = restoreReferences([element.extends.name as Type], uidMapping, referenceMapping)[0];
    }
    (element.children as YamlModel[]).forEach(child => {
        resolveIds(child, uidMapping, referenceMapping);
    });
}

function restoreReferences(types: Types, uidMapping: UidMapping, referenceMapping: ReferenceMapping): string[] {
    let restoredTypes = restoreTypes(types, uidMapping);
    return restoredTypes.map<string>(restoreType => {
        if (restoreType) {
            let hasUid = false;
            let restoreTypeTrim = restoreType.replace(uidRegex, (match, uid) => {
                if (uid) {
                    hasUid = true;
                    return uid;
                }
                return match;
            });
            if (hasUid && referenceMapping[restoreTypeTrim] !== null) {
                referenceMapping[restoreTypeTrim] = restoreType;
            }
            return restoreTypeTrim;
        }
        return restoreType;
    });
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
    } else if (type.intersectionType) {
        type.intersectionType.types = (type.intersectionType.types as Type[]).map(t => restoreType(t, uidMapping));
    } else if (type.arrayType) {
        type.arrayType = restoreType(type.arrayType, uidMapping);
    } else {
        if (type.typeId && uidMapping[type.typeId]) {
            type.typeName = `@uid:${uidMapping[type.typeId]}!@`;
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

    if (type.reflectedType) {
        return `[key: ${typeToString(type.reflectedType.key)}]: ${typeToString(type.reflectedType.value)}`;
    } else if (type.genericType) {
        return `${typeToString(type.genericType.outter)}<${typeToString(type.genericType.inner)}>`;
    } else if (type.intersectionType) {
        return (type.intersectionType.types as Type[]).map(t => typeToString(t)).join(' & ');
    } else if (type.arrayType) {
        return `${typeToString(type.arrayType)}[]`;
    } else {
        return typeToString(type.typeName);
    }
}
