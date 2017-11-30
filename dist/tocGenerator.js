"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var flags_1 = require("./common/flags");
var constants_1 = require("./common/constants");
function generateToc(elements, packageUid) {
    var result = [];
    var previousUid = null;
    if (elements) {
        var tocs = elements;
        if (flags_1.flags.enableAlphabetOrder) {
            tocs = elements.sort(sortToc);
        }
        var dictModuleName_1 = {};
        tocs.forEach(function (element) {
            if (element.uid.indexOf('constructor') >= 0) {
                return;
            }
            if (element.uid === previousUid) {
                return;
            }
            previousUid = element.uid;
            if (flags_1.flags.hasModule) {
                var secondLevelToc = {
                    uid: element.uid,
                    name: element.name.split('(')[0],
                    items: getFunctionLevelToc(element)
                };
                if (!dictModuleName_1[element.module]) {
                    dictModuleName_1[element.module] = {
                        // uid: `${element.package}.${element.module.replace(/\//g, '.')}`,
                        name: element.module,
                        items: []
                    };
                    result.push(dictModuleName_1[element.module]);
                }
                dictModuleName_1[element.module].items.push(secondLevelToc);
            }
            else {
                result.push({
                    uid: element.uid,
                    name: element.name.split('(')[0],
                    items: getFunctionLevelToc(element)
                });
            }
        });
    }
    return [{
            uid: packageUid,
            name: packageUid,
            items: result
        }];
}
exports.generateToc = generateToc;
function getFunctionLevelToc(element) {
    var result = [];
    if (flags_1.flags.enableFunctionLevelToc) {
        var children = element.children;
        if (element.name === constants_1.globalName && children) {
            children.forEach(function (child) {
                var tmp = child.split('.');
                result.push({
                    uid: child,
                    name: tmp[tmp.length - 1].split('(')[0]
                });
            });
        }
    }
    return result;
}
function sortToc(a, b) {
    if (!a.module && b.module) {
        return 1;
    }
    if (a.module && !b.module) {
        return -1;
    }
    if (a.module && b.module) {
        var moduleNameA = a.module.toUpperCase();
        var moduleNameB = b.module.toUpperCase();
        if (moduleNameA < moduleNameB) {
            return -1;
        }
        if (moduleNameA > moduleNameB) {
            return 1;
        }
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
