const { AdminCommand } = require('../../../Core/Structures/Command');

class ReasonCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'reason',
      info: '',
      keys: {
        nocase: { key: `.nocase`, value: '' },
        reasonset: { key: '.reasonset', value: '' }
      },
      minArgs: 2
    });
  }

  async execute(ctx) {
    let caseId = ctx.input._[0];
    let res = await ctx.client.Helpers.Modlog.update(ctx, caseId, ctx.input._.raw.slice(1).join(''));
    if (res === false)
      await ctx.decodeAndSend(this.keys.nocase, { number: caseId });
    else
      await ctx.decodeAndSend(this.keys.reasonset);
  }
}

module.exports = ReasonCommand;