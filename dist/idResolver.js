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
            resolveIds(element.children, uidMapping);
        });
    }
}
exports.resolveIds = resolveIds;
function restoreTypes(types, uidMapping) {
    if (types) {
        return types.map(function (t) {
            if (t.reflectedType) {
                return typeToString(t);
            }
            else if (t.genericType) {
                return typeToString(t);
            }
            else {
                if (t.typeId && uidMapping[t.typeId]) {
                    return uidMapping[t.typeId];
                }
                else {
                    return t.typeName;
                }
            }
        });
    }
    return null;
}
function typeToString(type) {
    if (!type) {
        return 'function';
    }
    if (typeof (type) === 'string') {
        var t = type.split('.');
        return t[t.length - 1];
    }
    if (type.isArray) {
        var newType = type;
        newType.isArray = false;
        return typeToString(newType) + "[]";
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
