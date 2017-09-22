"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./common/constants");
var flags_1 = require("./common/flags");
function postTransform(element) {
    return flattening(element);
}
exports.postTransform = postTransform;
function flattening(element) {
    if (!element) {
        return [];
    }
    var result = [];
    result.push({
        items: [element]
    });
    if (element.children) {
        var childrenUid_1 = [];
        var children = element.children;
        if (flags_1.flags.enableAlphabetOrder) {
            children = children.sort(sortYamlModel);
        }
        children.forEach(function (child) {
            if (child.children && child.children.length > 0) {
                result = result.concat(flattening(child));
            }
            else {
                childrenUid_1.push(child.uid);
                result[0].items.push(child);
            }
        });
        element.children = childrenUid_1;
        return result;
    }
}
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
