"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createElement(name, attributes) {
    var _a;
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    return {
        name: name,
        attributes: attributes || {},
        children: (_a = Array.prototype).concat.apply(_a, (children || []))
    };
}
exports.createElement = createElement;
