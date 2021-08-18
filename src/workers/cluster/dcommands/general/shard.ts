import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { ClusterStats, ShardStats } from '@cluster/types';
import { CommandType, discordUtil, guard, humanize } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';
import moment from 'moment';

export class ShardCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'shard',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Returns information about the shard the current guild is in, along with cluster stats.',
                    execute: (ctx) => this.showCurrentShard(ctx)
                },
                {
                    parameters: '{guildID}',
                    description: 'Returns information about the shard `guildID` is in, along with cluster stats.',
                    execute: (ctx, [guildID]) => this.showGuildShard(ctx, guildID)
                }
            ]
        });
    }
    public async showCurrentShard(
        context: CommandContext
    ): Promise<string | void> {
        if (guard.isGuildCommandContext(context)) {
            return await this.showGuildShard(context, context.channel.guild.id);
        }
        this.showCurrentDMShard(context);
    }

    public async showGuildShard(
        context: CommandContext,
        guildID: string
    ): Promise<string | void> {
        if (!/\d{17,23}/.test(guildID))
            return this.error('`' + guildID + '` is not a valid guildID');
        const clusterData = await discordUtil.cluster.getGuildClusterStats(context.cluster, guildID);

        const isSameGuild = guard.isGuildCommandContext(context) ? context.channel.guild.id === guildID : false;
        const descPrefix = isSameGuild ? 'This guild' : 'Guild `' + guildID + '`';
        void this.shardEmbed(context, clusterData.cluster, clusterData.shard, descPrefix + ` is on shard \`${clusterData.shard.id}\` and cluster \`${clusterData.cluster.id}\``);
    }

    public showCurrentDMShard(
        context: CommandContext
    ): void {
        const clusterData = discordUtil.cluster.getStats(context.cluster);
        void this.shardEmbed(context, clusterData, clusterData.shards[0], 'Discord DMs are on shard `0` in cluster `' + context.cluster.id.toString() + '`'); // should be cluster 0 always but idk
    }

    public async shardEmbed(
        context: CommandContext,
        clusterData: ClusterStats,
        shard: ShardStats,
        shardDesc: string
    ): Promise<void>  {
        const embed: MessageEmbedOptions = {};
        embed.title = `Shard ${shard.id}`;
        embed.url = context.util.websiteLink('shards');
        embed.description = shardDesc;
        embed.fields = [
            {
                name: 'Shard ' + shard.id.toString(),
                value: '```\nStatus: ' + discordUtil.cluster.statusEmojiMap[shard.status] +
                    `\nLatency: ${shard.latency}ms` +
                    `\nGuilds: ${shard.guilds}` +
                    `\nCluster: ${shard.cluster}` +
                    `\nLast update: ${humanize.duration(moment(), moment(shard.time, 'x'), 1)} ago\n\`\`\``
            },
            {
                name: 'Cluster ' + clusterData.id.toString(),
                value: 'CPU usage: ' + clusterData.userCpu.toFixed(1) +
                    '\nGuilds: ' + clusterData.guilds.toString() +
                    '\nRam used: ' + humanize.ram(clusterData.rss) +
                    `\nStarted <t:${Math.round(clusterData.readyTime / 1000)}:R>`
            },
            {
                name: 'Shards',
                value: '```\n' +
                    clusterData.shards.map(shard => {
                        return `${shard.id} ${discordUtil.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`;
                    }).join('\n') + '\n```'
            }
        ];
        await context.reply(embed);
    }
}

module.exports = ShardCommand;
