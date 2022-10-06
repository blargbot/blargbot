import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { GuildPermissionDetails } from '@blargbot/cluster/types';

export class ClusterGetGuildPermssionHandler extends ClusterEventService<`getGuildPermission`> {
    public constructor(
        cluster: Cluster
    ) {
        super(
            cluster,
            `getGuildPermission`,
            async ({ data, reply }) => reply(await this.getGuildPermission(data.guildId, data.userId))
        );
    }

    protected async getGuildPermission(guildId: string, userId: string): Promise<GuildPermissionDetails | undefined> {
        const member = await this.cluster.util.getMember(guildId, userId);
        if (member === undefined)
            return undefined;

        return {
            userId: member.id,
            guild: {
                id: member.guild.id,
                iconUrl: member.guild.iconURL ?? undefined,
                name: member.guild.name
            },
            ...Object.fromEntries(await Promise.all([
                [`autoresponses`, `autoresponse`] as const,
                [`ccommands`, `ccommand`] as const,
                [`censors`, `censor`] as const,
                [`farewell`, `farewell`] as const,
                [`greeting`, `greeting`] as const,
                [`interval`, `interval`] as const,
                [`rolemes`, `roleme`] as const
            ].map(async ([key, commandName]) => {
                const command = await this.cluster.commands.default.get(commandName, member.guild, member.user);
                return [key, command.state === `ALLOWED`] as const;
            })))
        };
    }
}
