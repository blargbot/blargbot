const { AdminCommand } = require('../../../Core/Structures/Command');
const moment = require('moment');

class UnbanCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'unban',
      info: 'Unbans a user.',
      usage: '<user>',
      flags: [
        { flag: 'r', name: 'reason', info: 'The reason for the ban.' }
      ],
      keys: {
        unbanned: { key: '.banned', value: ':ok_hand: **{{user}}** has been unbanned.' },
        invalidUser: { key: '.invaliduser', value: 'The specified user could not be found.' },
        unbannedAfter: { key: '.unbannedafter', value: 'Automatic unban after {{seconds}} seconds.' }

      },
      minArgs: 1
    });
  }

  async execute(ctx) {
    let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    if (!user)
      return await ctx.decodeAndSend(this.keys.invalidUser);

    let res = await this.client.Helpers.Moderation.unban({
      guild: ctx.guild, user, mod: ctx.user,
      reason: ctx.input.r ? ctx.input.r.raw.join('') : ''
    });

    if (res.valid === false)
      return await ctx.decodeAndSend(res.status, { target: user.fullName });

    return await ctx.decode(this.keys.unbanned, { user: user.fullName });
  }

  async event({ guild, data, start, expiry }) {
    let seconds = moment.duration(moment() - moment(start)).asSeconds();
    await this.client.Helpers.Moderation.unban({
      guild, user: data.userId, mod: this.client.user,
      reason: await this.decode(guild, this.keys.unbannedAfter, { seconds })
    });
  }
}

module.exports = UnbanCommand;