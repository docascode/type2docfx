"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateModules(tocRoots) {
    var result = [];
    tocRoots.forEach(function (tocRoot) {
        var root = {
            items: [],
            references: []
        };
        var moduleModel = {
            uid: tocRoot.uid,
            name: tocRoot.name,
            summary: '',
            langs: ['typeScript'],
            type: 'module',
            children: []
        };
        tocRoot.items.forEach(function (item) {
            moduleModel.children.push(item.uid);
            root.references.push({
                uid: item.uid,
                name: item.name
            });
        });
        root.items.push(moduleModel);
        result.push(root);
    });
    return result;
}
exports.generateModules = generateModules;
