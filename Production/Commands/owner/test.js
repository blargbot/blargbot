const { CatCommand } = require('../../../Core/Structures/Command');

class ShardCommand extends CatCommand {
  constructor(client) {
    super(client, {
      name: 'shards'
    });
  }

  async execute(ctx) {
    await ctx.decodeAndSend('generic.test');
  }
}

module.exports = ShardCommand;