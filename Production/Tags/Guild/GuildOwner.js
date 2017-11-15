const { Guild } = require.main.require('./Tag/Classes');

class GuildOwnerTag extends Guild {
  constructor(client) {
    super(client, {
      name: 'owner',
      args: [],
      minArgs: 0, maxArgs: 0
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args);
    return res.setContent(ctx.guild.ownerID);
  }
}

module.exports = GuildOwnerTag;