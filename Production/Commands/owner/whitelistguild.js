const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const exec = require('child_process').exec;

class WhitelistGuildCommand extends CatCommand {
  constructor(client) {
    super(client, {
      name: 'whitelistguild'
    });
  }

  async execute(ctx) {
    if (ctx.input._[0]) {
      await ctx.client.models.WhitelistedGuild.create({ id: ctx.input._[0] });
      return 'done';
    } else return 'ur dumb go away';
  }
}

module.exports = WhitelistGuildCommand;