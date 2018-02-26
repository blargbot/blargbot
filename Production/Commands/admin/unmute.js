const { AdminCommand } = require('../../../Core/Structures/Command');
const moment = require('moment');

class UnmuteCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'unmute',
      info: 'Unmutes a user.',
      usage: '<user>',
      flags: [
        { flag: 'r', name: 'reason', info: 'The reason for the unmute.' }
      ],
      keys: {
        unmuted: { key: '.unmuted', value: ':ok_hand: **{{user}}** has been unmuted.' },
        invalidUser: { key: '.invaliduser', value: 'The specified user could not be found.' },
        noRole: 'command.admin.mute.norole',
        unmutedAfter: { key: '.unmutedafter', value: 'Automatic unmute after {{seconds}} seconds.' }
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

    let res = await this.client.Helpers.Moderation.unmute({
      guild: ctx.guild, user, mod: ctx.user,
      reason: ctx.input.r ? ctx.input.r.raw.join('') : ''
    });

    if (res.valid === false)
      return await ctx.decodeAndSend(res.status, { target: user.fullName });

    return await ctx.decodeAndSend(this.keys.unmuted, { user: user.fullName });
  }

  async event({ guild, data, start, expiry }) {
    let seconds = moment.duration(moment() - moment(start)).asSeconds();
    let member = guild.members.get(data.userId);
    if (await guild.data.getKey('mutedRole'))
      await this.client.Helpers.Moderation.unmute({
        guild, user: member, mod: this.client.user,
        reason: await this.decode(guild, this.keys.unmutedAfter, { seconds })
      });
  }
}

module.exports = UnmuteCommand;