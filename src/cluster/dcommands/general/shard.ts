import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { ClusterStats, CommandResult, ShardStats } from '@blargbot/cluster/types';
import { CommandType, discord, guard, humanize, snowflake } from '@blargbot/cluster/utils';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.shard;

export class ShardCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `shard`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.current.description,
                    execute: (ctx) => this.showCurrentShard(ctx)
                },
                {
                    parameters: `{guildID}`,
                    description: cmd.guild.description,
                    execute: (ctx, [guildID]) => this.showGuildShard(ctx, guildID.asString)
                }
            ]
        });
    }
    public async showCurrentShard(
        context: CommandContext
    ): Promise<CommandResult> {
        if (guard.isGuildCommandContext(context))
            return await this.showGuildShard(context, context.channel.guild.id);

        return this.showCurrentDMShard(context);
    }

    public async showGuildShard(context: CommandContext, guildID: string): Promise<CommandResult> {
        if (!snowflake.test(guildID))
            return `❌ \`${guildID}\` is not a valid guildID`;
        const clusterData = await discord.cluster.getGuildClusterStats(context.cluster, guildID);

        const isSameGuild = guard.isGuildCommandContext(context) ? context.channel.guild.id === guildID : false;
        const descPrefix = isSameGuild ? `This guild` : `Guild \`${guildID}\``;
        return this.shardEmbed(context, clusterData.cluster, clusterData.shard, `${descPrefix} is on shard \`${clusterData.shard.id}\` and cluster \`${clusterData.cluster.id}\``);
    }

    public showCurrentDMShard(context: CommandContext): CommandResult {
        const clusterData = discord.cluster.getStats(context.cluster);
        return this.shardEmbed(context, clusterData, clusterData.shards[0], `Discord DMs are on shard \`0\` in cluster \`${context.cluster.id.toString()}\``); // should be cluster 0 always but idk
    }

    public shardEmbed(context: CommandContext, clusterData: ClusterStats, shard: ShardStats, shardDesc: string): CommandResult {
        return {
            title: `Shard ${shard.id}`,
            url: context.util.websiteLink(`shards`),
            description: shardDesc,
            fields: [
                {
                    name: `Shard ${shard.id.toString()}`,
                    value: `\`\`\`\nStatus: ${discord.cluster.statusEmojiMap[shard.status]}\nLatency: ${shard.latency}ms\nGuilds: ${shard.guilds}\nCluster: ${shard.cluster}\nLast update: ${humanize.duration(moment(), moment(shard.time, `x`), 1)} ago\n\`\`\``
                },
                {
                    name: `Cluster ${clusterData.id.toString()}`,
                    value: `CPU usage: ${clusterData.userCpu.toFixed(1)
                        }\nGuilds: ${clusterData.guilds.toString()
                        }\nRam used: ${humanize.ram(clusterData.rss)
                        }\nStarted <t:${Math.round(clusterData.readyTime / 1000)}:R>`
                },
                {
                    name: `Shards`,
                    value: `\`\`\`\n${clusterData.shards.map(shard => {
                        return `${shard.id} ${discord.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`;
                    }).join(`\n`)}\n\`\`\``
                }
            ]
        };
    }
}
