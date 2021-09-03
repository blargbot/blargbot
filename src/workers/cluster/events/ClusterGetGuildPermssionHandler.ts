import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { GuildPermissionDetails } from '@cluster/types';
import { mapping } from '@core/utils';

export class ClusterGetGuildPermssionHandler extends ClusterEventService<{ userId: string; guildId: string; }, GuildPermissionDetails | undefined> {
    public constructor(
        cluster: Cluster
    ) {
        super(
            cluster,
            'getGuildPermssion',
            mapping.mapObject({
                guildId: mapping.mapString,
                userId: mapping.mapString
            }),
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
        };
    }
}
