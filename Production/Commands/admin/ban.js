const { AdminCommand } = require('../../../Core/Structures/Command');
const moment = require('moment');

class BanCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'ban',
      info: 'Bans a user.',
      usage: '<user>',
      flags: [
        { flag: 'r', name: 'reason', info: 'The reason for the ban.' },
        { flag: 'd', name: 'days', info: 'The number of days for which messages should be deleted (defaults to 1).' },
        { flag: 't', name: 'time', info: 'How long the ban should be for.' }
      ],
      keys: {
        banned: { key: '.banned', value: ':ok_hand: **{{user}}** has been banned.' },
        invalidUser: { key: '.invaliduser', value: 'The specified user could not be found.' },
        invalidDuration: 'error.invalidduration',
        unbanIn: { key: '.unbunin', value: 'They will be unbanned in **{{seconds}}** seconds.' }
      },
      minArgs: 1
    });
  }

  async execute(ctx) {
    let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    if (!user)
      return await ctx.decodeAndSend(this.keys.invalidUser);

    let time;
    if (ctx.input.t) {
      time = this.client.Helpers.Time.parseDuration(ctx.input.t.raw.join(''));
      if (!time) {
        return await ctx.decodeAndSend(this.keys.invalidDuration);
      }
    }

    let res = await this.client.Helpers.Moderation.ban({
      guild: ctx.guild, user, mod: ctx.user,
      reason: ctx.input.r ? ctx.input.r.raw.join('') : '', time: time ? moment().add(time) : undefined
    });

    if (res.valid === false)
      return await ctx.decodeAndSend(res.status, { target: user.fullName });

    let msg = await ctx.decode(this.keys.banned, { user: user.fullName });
    if (time) msg += ' ' + await ctx.decode(this.keys.unbanIn, { seconds: time.asSeconds() });
    return msg;
  }
}

module.exports = BanCommand;