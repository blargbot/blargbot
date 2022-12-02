import { CommandContext, GlobalCommand } from '../../command/index.js';
import { avatarColours, CommandType, randChoose } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import Eris from 'eris';
import moment from 'moment-timezone';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.stats;

export class StatsCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'stats',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx) => this.getStats(ctx)
                }
            ]
        });
    }

    public async getStats(context: CommandContext): Promise<CommandResult> {
        const clusterStats = Object.values(await context.cluster.worker.request('getClusterStats', undefined));
        const mappedStats = { guilds: 0, users: 0, channels: 0, rss: 0 };
        clusterStats.forEach(c => {
            mappedStats.guilds += c?.guilds ?? 0;
            mappedStats.users += c?.users ?? 0;
            mappedStats.channels += c?.channels ?? 0;
            mappedStats.rss += c?.rss ?? 0;
        });
        const version = await context.cluster.version.getVersion();
        return {
            embeds: [
                {
                    color: randChoose(avatarColours),
                    timestamp: moment().toDate(),
                    title: cmd.default.embed.title,
                    footer: {
                        text: cmd.default.embed.footer.text,
                        icon_url: context.discord.user.avatarURL
                    },
                    fields: [{
                        name: cmd.default.embed.field.guilds.name,
                        value: cmd.default.embed.field.guilds.value({ guildCount: mappedStats.guilds }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.users.name,
                        value: cmd.default.embed.field.users.value({ userCount: mappedStats.users }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.channels.name,
                        value: cmd.default.embed.field.channels.value({ channelCount: mappedStats.channels }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.shards.name,
                        value: cmd.default.embed.field.shards.value({ shardCount: context.config.discord.shards.max }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.clusters.name,
                        value: cmd.default.embed.field.clusters.value({ clusterCount: Math.ceil(context.config.discord.shards.max / context.config.discord.shards.perCluster) }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.ram.name,
                        value: cmd.default.embed.field.ram.value({ ram: mappedStats.rss }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.version.name,
                        value: util.literal(version),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.uptime.name,
                        value: cmd.default.embed.field.uptime.value({ startTime: context.cluster.createdAt }),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.eris.name,
                        value: util.literal(Eris.VERSION),
                        inline: true
                    },
                    {
                        name: cmd.default.embed.field.nodeJS.name,
                        value: util.literal(process.version),
                        inline: true
                    }
                    ]
                }
            ]
        };
    }
}
