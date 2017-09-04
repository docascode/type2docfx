"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function tocGenerator(elements) {
    var result = [];
    if (elements) {
        elements.sort(sortToc).forEach(function (element) {
            if (element.uid.indexOf('constructor') >= 0) {
                return;
            }
            var firstLevelToc = {
                uid: element.uid,
                name: element.name.split('(')[0]
            };
            /*
            if (element.children) {
                let items: Array<TocItem> = [];
                (element.children as Array<YamlModel>).forEach(method => {
                    if (method.name !== 'constructor') {
                        items.push({
                            uid: method.uid,
                            name: method.name.split('(')[0]
                        });
                    }

                });
                firstLevelToc.items = items;
            }
            */
            result.push(firstLevelToc);
        });
    }
    return result;
}
exports.tocGenerator = tocGenerator;
function sortToc(a, b) {
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
