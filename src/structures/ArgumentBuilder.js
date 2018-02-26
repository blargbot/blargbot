class ArgumentBuilder {
  static get Required() { return new ArgumentBuilder(this.Types.REQUIRED); }
  static get Optional() { return new ArgumentBuilder(this.Types.OPTIONAL); }
  static get Literal() { return new ArgumentBuilder(this.Types.LITERAL); }

  static build(builder) {
    let format = '*';
    switch (builder.type) {
      case this.Types.REQUIRED:
        format = format.replace('*', '<*>');
        break;
      case this.Types.OPTIONAL:
        format = format.replace('*', '[*]');
        break;
      case this.Types.LITERAL:
        break;
    }

    let joinChar = ' ';
    switch (builder.childMode) {
      case this.ChildModes.AND:
        joinChar = ' ';
        break;
      case this.ChildModes.OR:
        joinChar = ' | ';
        if (builder.type === this.Types.LITERAL && this.children.length > 0)
          format = format.replace('*', '(*)');
        break;
    }

    if (builder.multiple) {
      format = format.replace('*', '*...');
    }

    if (!Array.isArray(builder.children))
      builder.children = ['arg'];

    let internal = builder.children.map(c => {
      if (typeof c === 'string')
        return c;
      return this.build(c);
    }).join(joinChar);

    return format.replace('*', internal);
  }

  constructor(type, children) {
    this.type = type || ArgumentBuilder.Types.LITERAL;
    this.childMode = ArgumentBuilder.ChildModes.AND;
    this.multiple = false;

    if (children == null)
      children = [];
    if (!Array.isArray(children))
      children = [children];
    this.children = children;
  }

  require(...builder) { return this.makeChild(ArgumentBuilder.Types.REQUIRED, builder); }
  optional(...builder) { return this.makeChild(ArgumentBuilder.Types.OPTIONAL, builder); }
  literal(...builder) { return this.makeChild(ArgumentBuilder.Types.LITERAL, builder); }
  text(text) { return this.addChild(text); }

  makeChild(type, builder) {
    if (Array.isArray(builder)) {
      for (const c of builder)
        this.makeChild(type, c);
      return this;
    }

    let child = new ArgumentBuilder(type);
    switch (typeof builder) {
      case 'function':
        builder(child);
        break;
      case 'string':
        child.addChild(builder);
        break;
      default:
        return this;
    }
    return this.addChild(child);
  }

  addChild(child) {
    this.children.push(child);
    return this;
  }

  setChildMode(mode) {
    this.childMode = mode;
    return this;
  }

  allowMany(multiple) { return this.allowMultiple(multiple); }
  allowMultiple(multiple) {
    this.multiple = multiple;
    return this;
  }

  build() {
    return ArgumentBuilder.build(this);
  }
}

ArgumentBuilder.Types = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
  LITERAL: 'literal'
};

ArgumentBuilder.ChildModes = {
  AND: 'and',
  OR: 'or'
}

module.exports = ArgumentBuilder;