class SubTag {
    constructor(name, args) {
        this.rawArgs = [];
    }

    get name() {
        if (this.rawArgs[0].length > 1)
            return this.rawArgs[0];
        else
            return this.rawArgs[0][0];
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
        console.log(arg);
        if (Array.isArray(arg)) {
            this.rawArgs.push(arg);
        } else this.rawArgs.push([arg]);
        let last = this.rawArgs[this.rawArgs.length - 1];
    }
}

module.exports = SubTag;