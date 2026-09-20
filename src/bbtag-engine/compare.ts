export function compare(a: string, b: string): number {
    const aBlocks = toBlocks(a);
    const bBlocks = toBlocks(b);

    const pairs = [] as Array<[string | number, string | number] | [string | number, undefined] | [undefined, string | number]>;
    const max = Math.max(aBlocks.length, bBlocks.length);
    for (let i = 0; i < max; i++)
        pairs.push([aBlocks[i], bBlocks[i]]);

    for (const [a, b] of pairs) {
        const key = `${typeof a}|${typeof b}`;
        if (!Object.hasOwn(sorter, key))
            continue;

        const value = callSorter(key, a, b);
        if (value !== 0)
            return value;
    }

    return 0;
}

function toBlocks(text: string): Array<string | number> {
    const regex = /[-+]?\d+(?:\.\d*)?(?:e\+?\d+)?/g;
    const numbers = text.match(regex) ?? [];
    const words = text.split(regex);

    const result = [];
    const max = Math.max(numbers.length, words.length);
    for (let i = 0; i < max; i++) {
        if (i < words.length)
            result.push(words[i]);
        if (i < numbers.length)
            result.push(parseFloat(numbers[i]));
    }
    return result;
}

type BlockTypePairs = `${keyof BlockTypes}|${keyof BlockTypes}`;
type BlockTypes = {
    string: string;
    number: number;
    undefined: undefined;
}

type ExtractBlockTypeCalls<T extends string> = T extends `${infer A}|${infer B}` ? A extends keyof BlockTypes ? B extends keyof BlockTypes ?
    { name: T; args: [left: BlockTypes[A], right: BlockTypes[B]]; }
    : never : never : never;

type TypedSorter = { [P in ExtractBlockTypeCalls<BlockTypePairs> as P['name']]: (...args: P['args']) => number };

function callSorter<K extends keyof TypedSorter>(key: K, ...args: Parameters<TypedSorter[K]>): number {
    return sorter[key](...args as [never, never]);
}

const sorter: TypedSorter = {
    'undefined|number': () => -1,
    'undefined|string': () => -1,
    'number|string': () => -1,
    'undefined|undefined': () => 0,
    'number|number': (l, r) => l - r,
    'string|string': (l, r) => l < r ? -1 : l > r ? 1 : 0,
    'number|undefined': () => 1,
    'string|undefined': () => 1,
    'string|number': () => 1
};
