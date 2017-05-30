const { CatCommand } = require('../../../Core/Structures/Command');

class ShardCommand extends CatCommand {
    constructor(client) {
        super(client, {
            name: 'shards'
        });
    }

    async execute(ctx) {
        let shardsRaw = await this.client.sender.awaitMessage('shardStatus');
        let shards = [], maxGuilds = 0, maxStatus = 0, maxId = 0;
        for (const shard of shardsRaw.message) {
            for (const erisShard of shard.shards) {
                if (erisShard.id.toString().length > maxId)
                    maxId = erisShard.id.toString.length;
                if (erisShard.status.length > maxStatus)
                    maxStatus = erisShard.status.length;
                if (erisShard.guilds.toString().length > maxGuilds)
                    maxGuilds = erisShard.guilds.toString().length;
                shards.push(erisShard);
            }
        }
        shards.sort((a, b) => {
            return a.id - b.id;
        });
        await ctx.send(`\`\`\`fix\n${shards.map(s => {
            return `${s.id == ctx.guild.shard.id ? '*' : ' '}${pad(s.id, maxId)} | Status: ${pad(s.status, maxStatus)} | Guilds: ${pad(s.guilds, maxGuilds)}`;
        }).join('\n')}\n\`\`\``);
    }
}

function pad(value, length) {
    return ' '.repeat(length - value.toString().length) + value;
}

module.exports = ShardCommand;