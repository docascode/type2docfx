"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./common/constants");
function postTransform(classModel) {
    var result = [classModel];
    if (classModel.children) {
        var childrenUid_1 = [];
        classModel.children.sort(sortYamlModel).forEach(function (method) {
            childrenUid_1.push(method.uid);
            result.push(method);
        });
        classModel.children = childrenUid_1;
    }
    return result;
}
exports.postTransform = postTransform;
function sortYamlModel(a, b) {
    // sort classes alphabetically, but GLOBAL at last
    if (a.uid === constants_1.globalUid) {
        return 1;
    }
    if (b.uid === constants_1.globalUid) {
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
