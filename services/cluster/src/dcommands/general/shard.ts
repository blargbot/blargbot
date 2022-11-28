import { CommandContext, GlobalCommand } from '../../command/index';
import { ClusterStats, CommandResult, ShardStats } from '@blargbot/cluster/types';
import { CommandType, discord, guard, snowflake } from '@blargbot/cluster/utils';
import { IFormattable } from '@blargbot/formatting';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.shard;

export class ShardCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'shard',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.current.description,
                    execute: (ctx) => this.showCurrentShard(ctx)
                },
                {
                    parameters: '{guildID}',
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

    public async showGuildShard(context: CommandContext, guildId: string): Promise<CommandResult> {
        if (!snowflake.test(guildId))
            return cmd.guild.invalidGuild({ id: guildId });
        const clusterData = await discord.cluster.getGuildClusterStats(context.cluster, guildId);

        const isSameGuild = guard.isGuildCommandContext(context) ? context.channel.guild.id === guildId : false;
        return this.#shardEmbed(context, clusterData.cluster, clusterData.shard, cmd.guild.embed.description[isSameGuild ? 'here' : 'other']({ shardId: clusterData.shard.id, clusterId: clusterData.cluster.id, guildId }));
    }

    public showCurrentDMShard(context: CommandContext): CommandResult {
        const clusterData = discord.cluster.getStats(context.cluster);
        return this.#shardEmbed(context, clusterData, clusterData.shards[0], cmd.current.dm.embed.description({ clusterId: clusterData.id })); // should be cluster 0 always but idk
    }

    #shardEmbed(context: CommandContext, cluster: ClusterStats, shard: ShardStats, shardDesc: IFormattable<string>): CommandResult {
        return {
            embeds: [
                {
                    title: cmd.common.embed.title({ shardId: shard.id }),
                    url: context.util.websiteLink('shards'),
                    description: shardDesc,
                    fields: [
                        {
                            name: cmd.common.embed.field.shard.name({ shardId: shard.id }),
                            value: cmd.common.embed.field.shard.value({
                                clusterId: cluster.id,
                                guildCount: shard.guilds,
                                lastUpdate: moment(shard.time, 'x'),
                                latency: shard.latency,
                                statusEmote: discord.cluster.statusEmojiMap[shard.status]
                            })
                        },
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
                                    latency: s.latency,
                                    statusEmote: discord.cluster.statusEmojiMap[s.status]
                                }))
                            })
                        }
                    ]
                }
            ]
        };
    }
}
