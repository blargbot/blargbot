import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes/index.js';
import { GuildPermissionDetails } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';

export class ClusterGetGuildPermssionListHandler extends ClusterEventService<'getGuildPermissionList'> {
    public constructor(
        cluster: Cluster
    ) {
        super(
            cluster,
            'getGuildPermissionList',
            async ({ data, reply }) => reply(await this.getGuildPermissionList(data.userId))
        );
    }

    protected async getGuildPermissionList(userId: string): Promise<GuildPermissionDetails[]> {
        const members = await Promise.all(this.cluster.discord.guilds
            .filter(g => g.members.get(userId) !== undefined)
            .map(g => this.cluster.util.getMember(g, userId)));

        return await Promise.all(members.filter(guard.hasValue)
            .map(async (member) => ({
                userId: member.id,
                guild: {
                    id: member.guild.id,
                    iconUrl: member.guild.iconURL ?? undefined,
                    name: member.guild.name
                },
                ...Object.fromEntries(await Promise.all([
                    ['autoresponses', 'autoresponse'] as const,
                    ['ccommands', 'ccommand'] as const,
                    ['censors', 'censor'] as const,
                    ['farewell', 'farewell'] as const,
                    ['greeting', 'greeting'] as const,
                    ['interval', 'interval'] as const,
                    ['rolemes', 'roleme'] as const
                ].map(async ([key, commandName]) => {
                    const command = await this.cluster.commands.default.get(commandName, member.guild, member.user);
                    return [key, command.state === 'ALLOWED'] as const;
                })))
            })));
    }
}
