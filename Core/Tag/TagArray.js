const TagError = require('./TagError');

class TagArray extends Array {

  constructor(...vals) {
    let values = [];
    for (const val of vals) {
      if (Array.isArray(val) && !val instanceof TagArray)
        values.push(...val);
      else values.push(val);
    }
    super(...values);
  }

  static get [Symbol.species]() { return Array; }

  get rawArgs() {
    return this;
  }

  async load(ctx, name) {
    this.ctx = ctx;
    this.name = name;

    let variable = await ctx.client.TagVariableManager.executeGet(ctx, name) || '';
    if (Array.isArray(variable)) {
      this.splice(0, this.length, ...variable);
    } else {
      throw new TagError(ctx.client.Constants.TagError.NOT_AN_ARRAY, { name, value: variable });
    }

    for (let elem of this) {
      for (let subElem of elem) {
        if (Array.isArray(subElem)) subElem = new TagArray(subElem);
      }
    }

    return this;
  }

  async save(ctx, name) {
    if (ctx) this.ctx = ctx;
    if (name) this.name = name;
    await this.ctx.client.TagVariableManager.executeSet(this.ctx, this.name, this);
  }

  get last() {
    return this[this.length - 1];
  }

  set last(value) {
    return this[this.length - 1] = value;
  }

  addArgument(token) {
    if (this.length === 0) this.push([]);
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

  map(...args) {
    let newArr = super.map(...args).map(a => [a]);
    this.splice(0, this.length, ...newArr);
    return this;
  }

  toString() {
    return `[${this.map(a => Array.isArray(a) ? a.join('') : a).join(';')}]`;
  }
}

module.exports = TagArray;