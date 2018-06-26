class Position {
    constructor(line, column) {
        this.line = line;
        this.column = column;
    }

    toArray() { return [this.line, this.column]; }
    toString() { return this.toArray().join(','); }
}

class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    toArray() { return [this.start.toArray(), this.end.toArray()]; }
    toString(sep = ':') { return this.toArray().map(p => `(${p})`).join(sep); }
}

module.exports = {
    Position,
    Range
};