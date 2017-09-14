"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function resolveIds(elements, uidMapping) {
    if (elements) {
        elements.forEach(function (element) {
            if (element.syntax) {
                if (element.syntax.parameters) {
                    element.syntax.parameters.forEach(function (p) {
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
            resolveIds(element.children, uidMapping);
        });
    }
}
exports.resolveIds = resolveIds;
function restoreTypes(types, uidMapping) {
    if (types) {
        return types.map(function (t) { return restoreType(t, uidMapping); });
    }
    return null;
}
function restoreType(type, uidMapping) {
    if (typeof (type) === 'string') {
        return type;
    }
    if (type.reflectedType) {
        type.reflectedType.key = restoreType(type.reflectedType.key, uidMapping);
        type.reflectedType.value = restoreType(type.reflectedType.value, uidMapping);
    }
    else if (type.genericType) {
        type.genericType.inner = restoreType(type.genericType.inner, uidMapping);
        type.genericType.outter = restoreType(type.genericType.outter, uidMapping);
    }
    else {
        if (type.typeId && uidMapping[type.typeId]) {
            type.typeName = "@" + uidMapping[type.typeId];
        }
    }
    return typeToString(type);
}
function typeToString(type) {
    if (!type) {
        return 'function';
    }
    if (typeof (type) === 'string') {
        if (type[0] === '@') {
            return type;
        }
        else {
            var t = type.split('.');
            return t[t.length - 1];
        }
    }
    if (type.isArray) {
        type.isArray = false;
        var result = typeToString(type) + "[]";
        type.isArray = true;
        return result;
    }
    if (type.reflectedType) {
        return "[key: " + typeToString(type.reflectedType.key) + "]: " + typeToString(type.reflectedType.value);
    }
    else if (type.genericType) {
        return typeToString(type.genericType.outter) + "<" + typeToString(type.genericType.inner) + ">";
    }
    else {
        return typeToString(type.typeName);
    }
}
exports.typeToString = typeToString;
