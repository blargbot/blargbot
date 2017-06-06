class SubTag {
    constructor(columnIndex, rowIndex) {
        this.columnIndex = columnIndex;
        this.rowIndex = rowIndex;
        this.rawArgs = [[]];
    }

    get name() {
        return this.rawArgs[0];
    }

    get args() {
        return this.rawArgs.slice(1).map(a => {
            if (typeof a[0] == 'string' && /^\s/.test(a[0]))
                a[0] = a[0].replace(/^\s+/, '');
            if (typeof a[a.length - 1] == 'string' && /\s$/.test(a[a.length - 1]))
                a[a.length - 1] = a[a.length - 1].replace(/\s+$/, '');
            return a;
        });
    }

    parseElement(element) {
        let temp = '';
        let arr;
        let subtag = element instanceof SubTag;
        if (subtag) {
            temp = `{${element.name}`;
            arr = element.args;
        } else arr = element;

        for (const elem of arr) {
            if (subtag) temp += ';';
            if (typeof elem == 'string') temp += elem;
            else if (Array.isArray(elem) || elem instanceof SubTag)
                temp += this.parseElement(elem);
        }

        if (subtag)
            temp += '}';
        return temp;
    }

    serialize(index) {
        let element;
        if (index)
            element = this.rawArgs[index];
        else element = this;
        return this.parseElement(element);
    }

    addArgument(arg) {
        // if (Array.isArray(arg)) {
        //    this.rawArgs.push(arg);
        // } else this.rawArgs.push([arg]);
        let last = this.rawArgs[this.rawArgs.length - 1];
        last.push(arg);
    }
}

module.exports = SubTag;