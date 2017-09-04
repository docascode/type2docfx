"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function resolveIds(elements, uidMapping) {
    if (elements) {
        elements.forEach(function (element) {
            element.children.forEach(function (child) {
                if (child.syntax) {
                    if (child.syntax.parameters) {
                        child.syntax.parameters.forEach(function (p) {
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
exports.resolveIds = resolveIds;
