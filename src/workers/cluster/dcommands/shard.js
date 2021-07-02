const BaseCommand = require('../structures/BaseCommand');
const bigInteger = require('big-integer');
const newbutils = require('../newbu');

class ShardCommand extends BaseCommand {
    constructor() {
        super({
            name: 'shard',
            category: newbutils.commandTypes.GENERAL,
            usage: 'shard <id>',
            info: 'Gives you information about the current shard.'
        });
    }

    async execute(msg, words, text) {
        try {
            let id = bigInteger(words[1] || msg.guild.id);
            let shard = id.shiftRight(22).mod(parseInt(process.env.SHARDS_MAX));
            let cluster = Math.floor(shard / config.shards.perCluster);
            let output = `Here's the shard and cluster information for a guild with the ID of \`${id}\`!\n\n**Cluster**: ${cluster}\n**Shard**: ${shard}`;
            output += `\n\n**Shards Per Cluster**: ${config.shards.perCluster}`;
            if (!words[1]) {
                output += `\n**Shards On This Cluster**: ${process.env.SHARDS_COUNT}`;
            }
            output += `\n**Total Shards**: ${process.env.SHARDS_MAX}\n\nCheck the status of your shards/cluster at <https://blargbot.xyz/shards>.`;
            await bu.send(msg, output);
        } catch (err) {
            await bu.send(msg, 'That wasn\'t a valid guild ID snowflake!');
        }

    }
}

module.exports = ShardCommand;
