/**
 * Returns the distinct values of an iterable in the order which they appear
 * @param {Iterable<T>} values The values to find the distinct values of
 * @returns {Iterable<T>}
 * @template T The element type 
 */
function* distinct(values) {
    const distinct = new Set();

    for (const value of values) {
        const length = distinct.size;
        distinct.add(value);
        if (distinct.size > length) {
            yield value;
        }
    }
}

module.exports = {
    distinct
}