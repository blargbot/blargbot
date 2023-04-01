import type { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes/index.js';
import type { GuildPermissionDetails } from '@blargbot/cluster/types.js';
import { hasValue } from '@blargbot/guards';
import type Eris from 'eris';

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

        return await Promise.all(members.filter(hasValue)
            .map(m => this.#getGuildPermissionDetails(m)));
    }

    async #getGuildPermissionDetails(member: Eris.Member): Promise<GuildPermissionDetails> {
        const props = await Promise.all([
            ['userId', member.id] as const,
            ['guild', {
                id: member.guild.id,
                iconUrl: member.guild.iconURL ?? undefined,
                name: member.guild.name
            }] as const,
            this.#isCommandAllowed('autoresponses', member, 'autoresponse'),
            this.#isCommandAllowed('ccommands', member, 'ccommand'),
            this.#isCommandAllowed('censors', member, 'censor'),
            this.#isCommandAllowed('farewell', member, 'farewell'),
            this.#isCommandAllowed('greeting', member, 'greeting'),
            this.#isCommandAllowed('interval', member, 'interval'),
            this.#isCommandAllowed('rolemes', member, 'roleme')
        ]);
        return Object.fromEntries(props);
    }

    async #isCommandAllowed<T extends PropertyKey>(key: T, member: Eris.Member, commandName: string): Promise<[T, boolean]> {
        const command = await this.cluster.commands.default.get(commandName, member.guild, member.user);
        return [key, command.state === 'ALLOWED'];
    }
}
