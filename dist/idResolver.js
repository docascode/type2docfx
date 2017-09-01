"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function resolveIds(classes, uidMapping) {
    if (classes) {
        classes.forEach(function (classItem) {
            classItem.children.forEach(function (method) {
                if (method.syntax) {
                    if (method.syntax.parameters) {
                        method.syntax.parameters.forEach(function (p) {
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
exports.resolveIds = resolveIds;
