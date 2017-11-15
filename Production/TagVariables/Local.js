const { TagVariable } = require('../../Core/Tag');

class LocalVariable extends TagVariable {

  get prefix() {
    return '~';
  }

  async _tagGet(ctx, name) {
    if (ctx.data) {
      return await ctx.data.getVariable(name);
    } else return '';
  }

  async _tagSet(ctx, name, value) {
    if (ctx.data) {
      return await ctx.data.setVariable(name, value);
    }
  }

}

module.exports = LocalVariable;