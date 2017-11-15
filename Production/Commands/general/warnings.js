const { GeneralCommand } = require('../../../Core/Structures/Command');

class WarningsCommand extends GeneralCommand {
  constructor(client) {
    super(client, {
      name: 'warnings',
      keys: {
        output: { key: '.output', value: '**{{user}}** has accumulated **{{amount}}** warning(s) in **{{guild}}**.' }
      }
    });
  }

  async execute(ctx) {
    let warnings = await ctx.guild.data.getKey('warnings');
    let resolve = ctx.client.Helpers.Resolve;
    let user;
    if (ctx.input._.length === 0)
      user = ctx.author;
    else {
      user = await resolve.user(ctx, ctx.input._.raw.join(''));
      if (user === null) return;
    }
    let amount = warnings[user.id] || 0;

    return await ctx.decodeAndSend(this.keys.output, {
      amount, user: user.fullName, guild: ctx.guild.name
    });
  }
}

module.exports = WarningsCommand;