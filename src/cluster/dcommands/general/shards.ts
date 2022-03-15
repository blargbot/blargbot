import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { ClusterStats, ShardStats } from '@blargbot/cluster/types';
import { CommandType, discord, guard, humanize, snowflake } from '@blargbot/cluster/utils';
import { EmbedOptions } from 'eris';
import moment from 'moment-timezone';

export class ShardsCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'shards',
            category: CommandType.GENERAL,
            flags: [
                {
                    flag: 'd',
                    word: 'down',
                    description: 'If provided, only shows downed shards for `b!shards`'
                }
            ],
            definitions: [
                {
                    parameters: '',
                    description: 'Shows a list of all shards.',
                    execute: (ctx, _, { d: down }) => this.showAllShards(ctx, down !== undefined)
                },
                {
                    parameters: '{guildID}',
                    description: 'Shows information about the shard and cluster `guildID` is in ',
                    execute: (ctx, [guildID]) => this.showGuildShards(ctx, guildID.asString)
                },
                {
                    parameters: '{clusterID:integer}',
                    description: 'Show information about `cluster`',
                    execute: (ctx, [clusterID]) => this.showClusterShards(ctx, clusterID.asInteger)
                }
            ]
        });
    }
    public async showAllShards(context: CommandContext, downOnly: boolean): Promise<string | EmbedOptions> {
        const shardConfig = context.config.discord.shards;
        const clusterCount = Math.ceil(shardConfig.max / shardConfig.perCluster);
        const clusterData = await context.cluster.worker.request('getClusterStats', undefined);
        let clusters = Object.values(clusterData).filter(guard.hasValue);
        if (downOnly) {
            clusters = clusters.filter(cluster => {
                const downedShards = cluster.shards.filter(shard => shard.status !== 'ready');
                return downedShards.length > 0;
            });
            if (clusters.length === 0)
                return this.info('No shards are currently down!');
            clusters = clusters.map(c => {
                c.shards.filter(s => s.status !== 'ready');
                return {
                    ...c,
                    shards: c.shards.filter(s => s.status !== 'ready')
                };
            });
        }
        const clusterFields = clusters.map(cluster => {
            let fieldValue = '';
            fieldValue += `Ready since: <t:${Math.round(cluster.readyTime / 1000)}:R>\nRam: ${humanize.ram(cluster.rss)}`;
            fieldValue += '\n**Shards**:\n```\n';
            fieldValue += cluster.shards.map(shard => {
                return `${shard.id} ${discord.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`;
            }).join('\n') + '\n```';
            return {
                name: 'Cluster ' + cluster.id.toString(),
                value: fieldValue,
                inline: true
            };
        });
        if (clusters.length === 0)
            return this.error('No cluster stats yet!');
        return {
            title: 'Shards',
            url: context.util.websiteLink('shards'),
            description: `I'm running on \`${clusterCount}\` cluster${clusterCount > 1 ? 's' : ''} and \`${shardConfig.max}\` shard${shardConfig.max > 1 ? 's' : ''}\n`,
            fields: clusterFields
        };
    }

    public async showGuildShards(context: CommandContext, guildIDStr: string): Promise<string | EmbedOptions> {
        if (!snowflake.test(guildIDStr))
            return this.error(`\`${guildIDStr}\` is not a valid guildID`);
        const guildData = await discord.cluster.getGuildClusterStats(context.cluster, guildIDStr);
        const isSameGuild = guard.isGuildCommandContext(context) ? context.channel.guild.id === guildIDStr : false;
        const descPrefix = isSameGuild ? 'This guild' : 'Guild `' + guildIDStr + '`';
        return this.shardEmbed(context, guildData.cluster, descPrefix + ` is on shard \`${guildData.shard.id}\` and cluster \`${guildData.cluster.id}\``, guildData.shard);
    }

    public async showClusterShards(
        context: CommandContext,
        clusterID: number
    ): Promise<string | EmbedOptions> {
        const clusterStats = await discord.cluster.getClusterStats(context.cluster, clusterID);
        const isValidCluster = Math.ceil(context.config.discord.shards.max / context.config.discord.shards.perCluster) - 1 >= clusterID && clusterID >= 0;
        if (clusterStats === undefined)
            return this.error(`Cluster ${clusterID} ${isValidCluster ? 'is not online at the moment' : 'does not exist'}`);
        return this.shardEmbed(context, clusterStats, '');
    }

    public shardEmbed(context: CommandContext, clusterData: ClusterStats, embedDesc: string, shard?: ShardStats): EmbedOptions {
        const embed: EmbedOptions = {};
        embed.title = shard !== undefined ? `Shard ${shard.id}` : `Cluster ${clusterData.id}`;
        embed.url = context.util.websiteLink('shards');
        embed.description = embedDesc;
        embed.fields = [
            {
                name: 'Cluster ' + clusterData.id.toString(),
                value: 'CPU usage: ' + clusterData.userCpu.toFixed(1) +
                    '\nGuilds: ' + clusterData.guilds.toString() +
                    '\nRam used: ' + humanize.ram(clusterData.rss) +
                    `\nStarted <t:${moment(clusterData.readyTime.toString(), 'x').format('X')}:R>`
            },
            {
                name: 'Shards',
                value: '```\n' +
                    clusterData.shards.map(shard => {
                        return `${shard.id} ${discord.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`;
                    }).join('\n') + '\n```'
            }
        ];
        if (shard !== undefined) {
            embed.fields.unshift({
                name: 'Shard ' + shard.id.toString(),
                value: '```\nStatus: ' + discord.cluster.statusEmojiMap[shard.status] +
                    `\nLatency: ${shard.latency}ms` +
                    `\nGuilds: ${shard.guilds}` +
                    `\nCluster: ${shard.cluster}` +
                    `\nLast update: ${humanize.duration(moment(), moment(shard.time, 'x'), 1)} ago\n\`\`\``
            });
        } else {
            const field = embed.fields.shift();
            embed.description = field?.value;
        }

        return embed;
    }
}
