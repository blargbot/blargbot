const { CatCommand } = require('../../../Core/Structures/Command');
const util = require('util');
const exec = require('child_process').exec;

class RespawnCommand extends CatCommand {
  constructor(client) {
    super(client, {
      name: 'respawn'
    });
  }

  async execute(ctx) {
    let shard = process.env.SHARD_ID || ctx.input._.join(' ');
    shard = parseInt(shard);
    await ctx.send(`I'll try my best to respawn shard ${shard}!`);
    ctx.client.sender.send('respawn', { id: shard, channel: ctx.channel.id });
  }
}

module.exports = RespawnCommand;