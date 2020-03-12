import { YamlModel, Type, Types } from './interfaces/YamlModel';
import { UidMapping } from './interfaces/UidMapping';
import { ReferenceMapping } from './interfaces/ReferenceMapping';
import { uidRegex } from './common/regex';
import { setOfTopLevelItems } from './common/constants';

export function resolveIds(element: YamlModel, uidMapping: UidMapping, referenceMapping: ReferenceMapping): void {
    if (element.syntax) {
        if (element.syntax.parameters) {
            for (const p of element.syntax.parameters) {
                p.type = restoreReferences(p.type, uidMapping, referenceMapping);
            }
        }

        if (element.syntax.return) {
            element.syntax.return.type = restoreReferences(element.syntax.return.type, uidMapping, referenceMapping);
        }
    }

    if (element.extends) {
        element.extends.name = restoreReferences([element.extends.name as Type], uidMapping, referenceMapping)[0];
    }

    for (const child of element.children as YamlModel[]) {
        resolveIds(child, uidMapping, referenceMapping);
        if (setOfTopLevelItems.has(child.type)) {
            referenceMapping[child.uid] = `@uid:${child.uid}!@`;
        }
    }
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
    if (typeof (type) === 'string') {
        return type;
    }

    if (type.reflectedType) {
        type.reflectedType.key = restoreType(type.reflectedType.key, uidMapping);
        type.reflectedType.value = restoreType(type.reflectedType.value, uidMapping);
    } else if (type.genericType) {
        type.genericType.inner = (type.genericType.inner as Type[]).map(t => restoreType(t, uidMapping));
        type.genericType.outter = restoreType(type.genericType.outter, uidMapping);
    } if (type.unionType) {
        type.unionType.types = (type.unionType.types as Type[]).map(t => restoreType(t, uidMapping));
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

export function typeToString(type: Type | string, kind?: string): string {
    if (!type) {
        return 'function';
    }

    if (typeof (type) === 'string') {
        if (type[0] === '@') {
            return type;
        } else if (kind && kind !== 'Property') {
            let t = type.split('.');
            return t[t.length - 1];
        } else {
            return type;
        }
    }

    if (type.reflectedType) {
        return `[key: ${typeToString(type.reflectedType.key)}]: ${typeToString(type.reflectedType.value)}`;
    } else if (type.genericType) {
        return `${typeToString(type.genericType.outter)}<${((type.genericType.inner as Type[]).map(t => typeToString(t)).join(', '))}>`;
    } else if (type.unionType) {
        return (type.unionType.types as Type[]).map(t => typeToString(t)).join(' | ');
    } else if (type.intersectionType) {
        return (type.intersectionType.types as Type[]).map(t => typeToString(t)).join(' & ');
    } else if (type.arrayType) {
        return `${typeToString(type.arrayType)}[]`;
    } else {
        return typeToString(type.typeName);
    }
}
