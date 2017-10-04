const TagArray = require('./TagArray');

class SubTagArg {
    constructor(columnIndex, rowIndex) {
        this.columnIndex = columnIndex;
        this.rowIndex = rowIndex;
        this.name = [];
        this.value = [];
        this.separated = false;
    }

    addArgument(arg) {
        if (this.separated)
            this.value.push(arg);
        else this.name.push(arg);
    }

    serialize() {
        return `{*${this.name.map(v => v.toString()).join('')};${this.value.map(v => v.toString()).join('')}}`;
    }

    toString() {
        return this.serialize();
    }
}

module.exports = SubTagArg;