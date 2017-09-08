"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generatePackage(elements) {
    var root = {
        items: [],
        references: []
    };
    var packageModel = null;
    if (elements && elements.length) {
        packageModel = {
            uid: null,
            name: null,
            summary: '',
            children: [],
            type: 'package',
            langs: ['typeScript']
        };
        elements.forEach(function (element) {
            root.references.push({
                uid: element.uid,
                name: element.name
            });
            packageModel.children.push(element.uid);
            if (!packageModel.uid && element.package) {
                packageModel.uid = element.package;
                packageModel.name = element.package;
            }
        });
    }
    root.items.push(packageModel);
    return root;
}
exports.generatePackage = generatePackage;
