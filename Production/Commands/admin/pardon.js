const { AdminCommand } = require('../../../Core/Structures/Command');

class PardonCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'pardon',
      info: 'Assigns a user a variable number of pardons.',
      usage: '<user>',
      flags: [
        { flag: 'c', name: 'count', info: 'The number of pardons to assign.' },
        { flag: 'r', name: 'reason', info: 'The reason for the pardon.' }
      ],
      keys: {
        invalidCount: { key: '.invalidcount', value: 'The count specified was not a number!' },
        invalidUser: { key: '.invaliduser', value: 'The specified user could not be found.' },
        negativeCount: { key: '.negativecount', value: 'At least one pardon must be assigned!' },
        pardonAssigned: { key: '.warningassigned', value: '**{{user}}** has been assigned **{{count}}** pardon(s).' }
      },
      minArgs: 1
    });
  }

  async execute(ctx) {
    let user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    if (!user)
      return await ctx.decodeAndSend(this.keys.invalidUser);
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

    this.client.Helpers.Warning.givePardons(ctx, user, count, ctx.input.r ? ctx.input.r.join('') : '');

    return await ctx.decodeAndSend(this.keys.pardonAssigned, { user: user.fullName, count });
  }
}

module.exports = PardonCommand;