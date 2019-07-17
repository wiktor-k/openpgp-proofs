"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function render(element) {
    if (element == null)
        return '';
    if (typeof element !== "object")
        element = String(element);
    if (typeof element === "string")
        return element.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    //if (element instanceof Raw) return element.html;
    console.assert(!!element.attributes, 'Element attributes must be defined:\n' + JSON.stringify(element));
    var elementAttributes = element.attributes;
    var attributes = Object.keys(elementAttributes).filter(function (key) {
        var value = elementAttributes[key];
        return value != null;
    }).map(function (key) {
        var value = elementAttributes[key];
        if (value === true) {
            return key;
        }
        return key + "=\"" + String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + "\"";
    }).join(' ');
    if (attributes.length > 0) {
        attributes = ' ' + attributes;
    }
    var children = element.children.length > 0 ? ">" + element.children.map(function (child) { return render(child); }).join('') : '>';
    return "<" + element.name + attributes + children + "</" + element.name + ">";
}
exports.render = render;
