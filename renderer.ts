export function render(element: JSX.Element | string | null): string {
    if (element == null) return '';
    if (typeof element !== "object") element = String(element);
    if (typeof element === "string") return element.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    //if (element instanceof Raw) return element.html;
    console.assert(!!element.attributes, 'Element attributes must be defined:\n' + JSON.stringify(element));
    const elementAttributes = element.attributes;
    let attributes = Object.keys(elementAttributes).filter(key => {
        const value = (elementAttributes as any)[key];
        return value != null;
    }).map(key => {
        const value = (elementAttributes as any)[key];
        if (value === true) {
            return key;
        }
        return `${key}="${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}"`;
    }).join(' ');
    if (attributes.length > 0) {
        attributes = ' ' + attributes;
    }
    const children = element.children.length > 0 ? `>${element.children.map(child => render(child)).join('')}` : '>';
    return `<${element.name}${attributes}${children}</${element.name}>`;
}
