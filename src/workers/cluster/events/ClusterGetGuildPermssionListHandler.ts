import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { GuildPermissionDetails } from '@cluster/types';
import { guard, mapping } from '@core/utils';

export class ClusterGetGuildPermssionListHandler extends ClusterEventService<{ userId: string; }, GuildPermissionDetails[]> {
    public constructor(
        cluster: Cluster
    ) {
        super(
            cluster,
            'getGuildPermssionList',
            mapping.mapObject({
                userId: mapping.mapString
            }),
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
                    const command = this.cluster.commands.get(commandName);
                    if (command === undefined)
                        return [key, false] as const;

                    return [key, await this.cluster.commands.canExecuteDefaultCommand({
                        author: member.user,
                        location: member.guild,
                        util: this.cluster.util
                    }, command)] as const;
                })))
            })));
    }
}
