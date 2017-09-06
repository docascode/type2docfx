"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateToc(elements) {
    var result = [];
    var previousUid = null;
    if (elements) {
        elements.sort(sortToc).forEach(function (element) {
            if (element.uid.indexOf('constructor') >= 0) {
                return;
            }
            if (element.uid === previousUid) {
                return;
            }
            previousUid = element.uid;
            var secondLevelToc = {
                uid: element.uid,
                name: element.name.split('(')[0]
            };
            if (result.length === 0 || result[result.length - 1].name !== element.module) {
                result.push({
                    uid: element.package + "." + element.module.replace(/\//g, '.'),
                    name: element.module,
                    items: []
                });
            }
            result[result.length - 1].items.push(secondLevelToc);
        });
    }
    return result;
}
exports.generateToc = generateToc;
function sortToc(a, b) {
    var moduleNameA = a.module.toUpperCase();
    var moduleNameB = b.module.toUpperCase();
    if (moduleNameA < moduleNameB) {
        return -1;
    }
    if (moduleNameA > moduleNameB) {
        return 1;
    }
    var nameA = a.name.toUpperCase();
    var nameB = b.name.toUpperCase();
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    return 0;
}
