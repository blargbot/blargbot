const { AdminCommand } = require('../../../Core/Structures/Command');
const moment = require('moment');

class MuteCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'mute',
      info: 'Mutes a user.',
      usage: '<user>',
      flags: [
        { flag: 'r', name: 'reason', info: 'The reason for the mute.' },
        { flag: 't', name: 'time', info: 'How long the mute should be for.' }
      ],
      keys: {
        muted: { key: '.muted', value: ':ok_hand: **{{user}}** has been muted.' },
        invalidUser: { key: '.invaliduser', value: 'The specified user could not be found.' },
        noRole: { key: '.norole', value: 'A muted role has not been set! Use the `setup mute` command to configure it.' },
        invalidDuration: 'error.invalidduration',
        unmuteIn: { key: '.unmutein', value: 'They will be unmuted in **{{seconds}}** seconds.' }
      },
      minArgs: 1
    });
  }

  async execute(ctx) {
    let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    if (!user)
      return await ctx.decodeAndSend(this.keys.invalidUser);
    if (!(await ctx.guild.data.getKey('mutedRole')))
      return await ctx.decodeAndSend(this.keys.noRole);
    let time;
    if (ctx.input.t) {
      time = this.client.Helpers.Time.parseDuration(ctx.input.t.raw.join(''));
      if (!time) {
        return await ctx.decodeAndSend(this.keys.invalidDuration);
      }
    }

    let res = await this.client.Helpers.Moderation.mute({
      guild: ctx.guild, user, mod: ctx.user,
      reason: ctx.input.r ? ctx.input.r.raw.join('') : '', time: time ? moment().add(time) : undefined
    });

    if (res.valid === false)
      return await ctx.decodeAndSend(res.status, { target: user.fullName });
    let msg = await ctx.decode(this.keys.muted, { user: user.fullName });
    if (time) msg += ' ' + await ctx.decode(this.keys.unmuteIn, { seconds: time.asSeconds() });
    return msg;
  }
}

module.exports = MuteCommand;