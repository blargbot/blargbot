import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { GuildPermissionDetails } from '@cluster/types';
import { guard } from '@core/utils';

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
        const members = await Promise.all(this.cluster.discord.guilds.cache.map(g => this.cluster.util.getMember(g, userId)));

        return await Promise.all(members.filter(guard.hasValue)
            .map(async (member) => ({
                userId: member.id,
                guild: {
                    id: member.guild.id,
                    iconUrl: member.guild.iconURL({ dynamic: true, format: 'png', size: 512 }) ?? undefined,
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
