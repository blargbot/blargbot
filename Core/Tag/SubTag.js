const TagArray = require('./TagArray');
const SubTagArg = require('./SubTagArg');

class SubTag {
  constructor(columnIndex, rowIndex) {
    this.columnIndex = columnIndex;
    this.rowIndex = rowIndex;
    this.rawArgs = [[]];
    this.named = false;
    this.pipe = false;
    this.piping = false;
    this.namedArgs = [];
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

  normalize(a) {
    if (Array.isArray(a) && !(a instanceof TagArray))
      return a.join('');
    return a.toString();
  }

  serialize() {
    let temp = `{${this.name}`;
    if (this.pipe !== false) {
      temp += `!${this.pipe.map(this.normalize).join('')}`;
    }
    if (this.named) {
      temp += '=' + this.namedArgs.map(this.normalize).join('');
    } else {
      let arr = this.args.map(this.normalize);
      if (arr.length > 0)
        temp += `;${arr.join(';')}`;
    }
    temp += '}';
    return temp;

  }

  addArgument(arg) {
    if (this.piping) {
      this.pipe.push(arg);
    } else if (!this.named) {
      let last = this.rawArgs[this.rawArgs.length - 1];
      last.push(arg);
    } else if (arg instanceof SubTagArg) {
      this.namedArgs.push(arg);
    }
  }

  toString() {
    return this.serialize();
  }
}

module.exports = SubTag;