export function* expand<T>(
    source: Iterable<T>,
    selector: (value: T, index: number) => Iterable<T>,
    mode: 'depthFirst' | 'breadthFirst' = 'breadthFirst'
): Iterable<T> {
    let expand: (expanded: Iterable<T>, index: number) => void;
    const items = [...source];
    switch (mode) {
        case 'breadthFirst':
            expand = (expanded) => items.push(...expanded);
            break;
        case 'depthFirst':
            expand = (expanded, i) => items.splice(i + 1, 0, ...expanded);
            break;
        default:
            throw new Error('Unknown expansion mode');
    }

    for (let i = 0; i < items.length; i++) {
        yield items[i];
        expand(selector(items[i], i), i);
    }
}
