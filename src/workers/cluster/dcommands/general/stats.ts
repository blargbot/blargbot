import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { avatarColours, CommandType, humanize, randChoose } from '@cluster/utils';
import discordjs, { MessageEmbedOptions } from 'discord.js';
import moment from 'moment';

export class StatsCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'stats',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gives you some information about me',
                    execute: (ctx) => this.getStats(ctx)
                }
            ]
        });
    }

    public async getStats(context: CommandContext): Promise<MessageEmbedOptions> {
        const clusterStats = Object.values(await context.cluster.worker.request('getClusterStats', undefined));
        const mappedStats = { guilds: 0, users: 0, channels: 0, rss: 0 };
        clusterStats.forEach(c => {
            mappedStats.guilds += c?.guilds ?? 0;
            mappedStats.users += c?.users ?? 0;
            mappedStats.channels += c?.channels ?? 0;
            mappedStats.rss += c?.rss ?? 0;
        });
        const version = await context.database.vars.get('version');
        return {
            color: randChoose(avatarColours),
            timestamp: moment().toDate(),
            title: 'Bot Statistics',
            footer: {
                text: 'blargbot',
                icon_url: context.discord.user.avatarURL() ?? undefined
            },
            fields: [{
                name: 'Guilds',
                value: mappedStats.guilds.toString(),
                inline: true
            },
            {
                name: 'Users',
                value: mappedStats.users.toString(),
                inline: true
            },
            {
                name: 'Channels',
                value: mappedStats.channels.toString(),
                inline: true
            },
            {
                name: 'Shards',
                value: context.config.discord.shards.max.toString(),
                inline: true
            },
            {
                name: 'Clusters',
                value: Math.ceil(context.config.discord.shards.max / context.config.discord.shards.perCluster).toString(),
                inline: true
            },
            {
                name: 'RAM',
                value: humanize.ram(mappedStats.rss),
                inline: true
            },
            {
                name: 'Version',
                value: `${version?.major ?? 0}.${version?.minor ?? 0}.${version?.patch ?? 0}`,
                inline: true
            },
            {
                name: 'Uptime',
                value: `<t:${context.cluster.createdAt.unix()}:R>`,
                inline: true
            },
            {
                name: 'Djs',
                value: discordjs.version,
                inline: true
            },
            {
                name: 'Node.js',
                value: process.version,
                inline: true
            }
            ]
        };
    }
}
