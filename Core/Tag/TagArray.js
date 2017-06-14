class TagArray extends Array {

    constructor() {
        super();
    }

    static get [Symbol.species]() { return Array; }

    get rawArgs() {
        return this;
    }

    async load(ctx, name) {
        this.ctx = ctx;
        this.name = name;
        return this;
    }

    async save(ctx, name) {
        if (name) this.name = name;
    }

    get last() {
        return this[this.length - 1];
    }

    set last(value) {
        return this[this.length - 1] = value;
    }

    addArgument(token) {
        if (!Array.isArray(this.last)) {
            this.last = [this.last];
        }
        this.last.push(token);
    }

    setPosition(column, row) {
        this.column = column;
        this.row = row;
        return this;
    }

    toString() {
        return `[${this.map(a => Array.isArray(a) ? a.join('') : a).join(';')}]`;
    }
}

module.exports = TagArray;