"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generatePackage(elements) {
    var root = {
        items: [],
        reference: []
    };
    var packageModel = null;
    if (elements && elements.length) {
        packageModel = {
            uid: elements[0].package,
            name: elements[0].package,
            summary: '',
            children: [],
            type: 'package',
            langs: ['typeScript']
        };
        elements.forEach(function (element) {
            root.reference.push({
                uid: element.uid,
                name: element.name
            });
            packageModel.children.push(element.uid);
        });
    }
    root.items.push(packageModel);
    return root;
}
exports.generatePackage = generatePackage;
