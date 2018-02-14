const { AdminCommand } = require('../../../Core/Structures/Command');

class WarnCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'warn',
      info: 'Assigns a user a variable number of warnings.',
      usage: '<user>',
      flags: [
        { flag: 'c', name: 'count', info: 'The number of warnings to assign.' },
        { flag: 'r', name: 'reason', info: 'The reason for the warning.' }
      ],
      keys: {
        invalidCount: { key: '.invalidcount', value: 'The count specified was not a number!' },
        negativeCount: { key: '.negativecount', value: 'At least one warning must be assigned!' },
        warningAssigned: { key: '.warningassigned', value: '**{{user}}** has been assigned **{{count}}** warning(s).' }
      },
      minArgs: 1
    });
  }

  async execute(ctx) {
    let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    let count;
    if (ctx.input.c) {
      count = parseInt(ctx.input.c.raw.join(''));
      if (isNaN(count)) {
        return await ctx.decodeAndSend(this.keys.invalidCount);
      }
    } else count = 1;
    if (count <= 0) {
      return await ctx.decodeAndSend(this.keys.negativeCount);
    }

    this.client.Helpers.Warning.giveWarnings(ctx, user, count, ctx.input.r ? ctx.input.r.join('') : '');

    return await ctx.decodeAndSend(this.keys.warningAssigned, { user: user.fullName, count });
  }
}

module.exports = WarnCommand;