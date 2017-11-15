const { TagVariable } = require('../../Core/Tag');

class GuildVariable extends TagVariable {

  get prefix() {
    return '_';
  }

  async _tagGet(ctx, name) {
    return await ctx.guild.data.getTagVariable(name);
  }

  async _tagSet(ctx, name, value) {
    return await ctx.guild.data.setTagVariable(name, value);
  }

  async _ccGet(ctx, name) {
    return await ctx.guild.data.getVariable(name);
  }

  async _ccSet(ctx, name, value) {
    return await ctx.guild.data.setVariable(name, value);
  }

}

module.exports = GuildVariable;