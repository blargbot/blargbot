export function toSortedBy<Item, SortBy>(
    source: Iterable<Item>,
    sortBy: (item: Item, index: number) => SortBy,
    compare: (a: SortBy, b: SortBy) => number
): Item[] {
    return Iterator.from(source[Symbol.iterator]())
        .map((v, i) => ({ item: v, sortBy: sortBy(v, i) }))
        .toArray()
        .sort((a, b) => compare(a.sortBy, b.sortBy))
        .map(x => x.item);
}
