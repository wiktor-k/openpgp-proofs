declare namespace JSX {
    interface IntrinsicElements {
        [tag: string]: any;
    }
    interface Element {
        name: string;
        attributes: { [name: string]: string };
        children: JSX.Element[];
    }
}
