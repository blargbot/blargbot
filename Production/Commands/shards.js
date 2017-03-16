const { CatCommand } = _core.Structures.Command;

class ShardCommand extends CatCommand {
    constructor() {
        super({
            name: 'shards'
        });
    }

    async execute(ctx) {
        await super.execute(ctx);
        let shards = await _discord.sender.awaitMessage('shardStatus');
        await ctx.send(_dep.util.inspect(shards));
    }
}

module.exports = ShardCommand;