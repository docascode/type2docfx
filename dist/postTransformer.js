"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./common/constants");
function postTransform(element) {
    var result = [element];
    if (element.children) {
        var childrenUid_1 = [];
        element.children.sort(sortYamlModel).forEach(function (child) {
            childrenUid_1.push(child.uid);
            result.push(child);
        });
        element.children = childrenUid_1;
    }
    return {
        items: result
    };
}
exports.postTransform = postTransform;
function sortYamlModel(a, b) {
    if (a.numericValue !== undefined && b.numericValue !== undefined) {
        return a.numericValue - b.numericValue;
    }
    // sort classes alphabetically, but GLOBAL at last, contructor first
    if (a.uid === constants_1.globalUid || b.name === constants_1.constructorName) {
        return 1;
    }
    if (b.uid === constants_1.globalUid || a.name === constants_1.constructorName) {
        return -1;
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
