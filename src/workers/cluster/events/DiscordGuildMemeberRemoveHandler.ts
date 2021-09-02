import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { GuildMember } from 'discord.js';

export class DiscordGuildMemeberRemoveHandler extends DiscordEventService<'guildMemberRemove'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberRemove', cluster.logger);
    }

    public async execute(member: GuildMember): Promise<void> {
        await Promise.all([
            this.cluster.moderation.bans.userLeft(member),
            this.cluster.moderation.eventLog.userLeft(member),
            this.cluster.greetings.farewell(member)
        ]);
    }
}
