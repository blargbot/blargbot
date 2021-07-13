import { Guild, Member } from 'eris';
import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class DiscordGuildMemeberAddHandler extends DiscordEventService<'guildMemberAdd'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberAdd', cluster.logger);
    }

    protected async execute(_guild: Guild, member: Member): Promise<void> {
        await Promise.all([
            this.cluster.database.users.upsert(member.user),
            this.cluster.moderation.eventLog.userJoined(member),
            this.cluster.greetings.greet(member)
        ]);
    }
}
