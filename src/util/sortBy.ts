export function sortBy<T, R>(items: T[], selector: (value: T, index: number) => R, comparer: (a: R, b: R) => number): T[] {
    const keyed = items.map((v, i) => ({ v, i: selector(v, i) }))
        .sort((a, b) => comparer(a.i, b.i));
    const len = items.length;
    for (let i = 0; i < len; i++)
        items[i] = keyed[i].v;
    return items;
}

type NaturalSortKey = ReadonlyArray<string | number>;
export function toNaturalSortKey(value: string): NaturalSortKey {
    const regex = /[-+]?\d+(?:\.\d*)?(?:e\+?\d+)?/g;
    const numbers = value.match(regex) ?? [];
    const words = value.split(regex);

    const result = [];
    const max = Math.max(numbers.length, words.length);
    for (let i = 0; i < max; i++) {
        if (i < words.length)
            result.push(words[i]);
        if (i < numbers.length)
            result.push(parseFloat(numbers[i]));
    }
    return Object.freeze(result);
}

export function compareNaturalSortKeys(a: NaturalSortKey, b: NaturalSortKey): -1 | 0 | 1 {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const ai = a[i];
        const bi = b[i];
        if (typeof ai === 'number') {
            if (typeof bi === 'string')
                return -1;
            const diff = ai - bi;
            if (diff !== 0)
                return Math.sign(diff) as -1 | 1;
        } else if (typeof bi === 'number')
            return 1;
        else if (ai < bi)
            return -1;
        else if (ai > bi)
            return 1;
    }

    return Math.sign(a.length - b.length) as -1 | 1;
}
