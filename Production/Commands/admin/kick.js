const { AdminCommand } = require('../../../Core/Structures/Command');

class KickCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'kick',
      info: 'Kicks a user.',
      usage: '<user>',
      flags: [
        { flag: 'r', name: 'reason', info: 'The reason for the kick.' }
      ],
      keys: {
        kicked: { key: '.kicked', value: ':ok_hand: **{{user}}** has been kicked.' },
        invalidUser: { key: '.invaliduser', value: 'The specified user could not be found.' }
      },
      minArgs: 1
    });
  }

  async execute(ctx) {
    let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    if (!user)
      return await ctx.decodeAndSend(this.keys.invalidUser);

    let res = await this.client.Helpers.Moderation.kick({
      guild: ctx.guild, user, mod: ctx.user,
      reason: ctx.input.r ? ctx.input.r.raw.join('') : ''
    });
    if (res.valid === false)
      return await ctx.decodeAndSend(res.status, { target: user.fullName });

    return await ctx.decodeAndSend(this.keys.kicked, { user: user.fullName });
  }
}

module.exports = KickCommand;