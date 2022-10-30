import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { ClusterStats, CommandResult, ShardStats } from '@blargbot/cluster/types';
import { CommandType, discord, guard, snowflake } from '@blargbot/cluster/utils';
import { IFormattable } from '@blargbot/formatting';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.shards;

export class ShardsCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'shards',
            category: CommandType.GENERAL,
            flags: [
                { flag: 'd', word: 'down', description: cmd.flags.down }
            ],
            definitions: [
                {
                    parameters: '',
                    description: cmd.all.description,
                    execute: (ctx, _, { d: down }) => this.showAllShards(ctx, down !== undefined)
                },
                {
                    parameters: '{guildID}',
                    description: cmd.guild.description,
                    execute: (ctx, [guildID]) => this.showGuildShards(ctx, guildID.asString)
                },
                {
                    parameters: '{clusterID:integer}',
                    description: cmd.cluster.description,
                    execute: (ctx, [clusterID]) => this.showClusterShards(ctx, clusterID.asInteger)
                }
            ]
        });
    }
    public async showAllShards(context: CommandContext, downOnly: boolean): Promise<CommandResult> {
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
                return cmd.all.noneDown;
            clusters = clusters.map(c => {
                c.shards.filter(s => s.status !== 'ready');
                return {
                    ...c,
                    shards: c.shards.filter(s => s.status !== 'ready')
                };
            });
        }

        if (clusters.length === 0)
            return cmd.all.noStats;

        return {
            embeds: [
                {
                    title: cmd.all.embed.title,
                    url: context.util.websiteLink('shards'),
                    description: cmd.all.embed.description({ clusterCount, shardCount: shardConfig.max }),
                    fields: clusters.map(c => ({
                        name: cmd.all.embed.field.name({ clusterId: c.id }),
                        value: cmd.all.embed.field.value({
                            startTime: moment(c.readyTime, 'x'),
                            ram: c.rss,
                            shards: c.shards.map(s => ({
                                id: s.id,
                                statusEmote: discord.cluster.statusEmojiMap[s.status],
                                latency: s.latency
                            }))
                        })
                    }))
                }
            ]
        };
    }

    public async showGuildShards(context: CommandContext, guildId: string): Promise<CommandResult> {
        if (!snowflake.test(guildId))
            return cmd.guild.invalidGuild({ guildId });
        const guildData = await discord.cluster.getGuildClusterStats(context.cluster, guildId);
        const isSameGuild = guard.isGuildCommandContext(context) ? context.channel.guild.id === guildId : false;
        return this.shardEmbed(context, guildData.cluster, guildData.shard, cmd.guild.embed.description[isSameGuild ? 'here' : 'other']({ guildId, clusterId: guildData.cluster.id, shardId: guildData.shard.id }));
    }

    public async showClusterShards(
        context: CommandContext,
        clusterId: number
    ): Promise<CommandResult> {
        const clusterStats = await discord.cluster.getClusterStats(context.cluster, clusterId);
        const isValidCluster = Math.ceil(context.config.discord.shards.max / context.config.discord.shards.perCluster) - 1 >= clusterId && clusterId >= 0;
        if (clusterStats === undefined)
            return isValidCluster
                ? cmd.common.noStats({ clusterId })
                : cmd.common.invalidCluster;
        return this.shardEmbed(context, clusterStats);
    }

    public shardEmbed(context: CommandContext, cluster: ClusterStats, shard?: ShardStats, embedDesc?: IFormattable<string>): CommandResult {
        return {
            embeds: [
                {
                    url: context.util.websiteLink('shards'),
                    description: embedDesc,
                    fields: [
                        ...shard === undefined ? [] : [{
                            name: cmd.common.embed.field.shard.name({ shardId: shard.id }),
                            value: cmd.common.embed.field.shard.value({
                                clusterId: shard.cluster,
                                guildCount: shard.guilds,
                                lastUpdate: moment(shard.time, 'x'),
                                latency: shard.latency,
                                statusEmote: discord.cluster.statusEmojiMap[shard.status]
                            })
                        }],
                        {
                            name: cmd.common.embed.field.cluster.name({ clusterId: cluster.id }),
                            value: cmd.common.embed.field.cluster.value({
                                cpu: cluster.userCpu,
                                guildCount: cluster.guilds,
                                ram: cluster.rss,
                                startTime: moment(cluster.readyTime, 'x')
                            })
                        },
                        {
                            name: cmd.common.embed.field.shards.name,
                            value: cmd.common.embed.field.shards.value({
                                shards: cluster.shards.map(s => ({
                                    id: s.id,
                                    statusEmote: discord.cluster.statusEmojiMap[s.status],
                                    latency: s.latency
                                }))
                            })
                        }
                    ]
                }
            ]
        };
    }
}
