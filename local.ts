export function createElement(name: string, attributes: Object, ...children: JSX.Element[]) {
    return {
        name,
        attributes: attributes || {},
        children: Array.prototype.concat(...(children || []))
    };
}
