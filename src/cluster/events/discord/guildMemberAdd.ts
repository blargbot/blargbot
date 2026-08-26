import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';

export class DiscordGuildMemeberAddHandler extends DiscordEventService<'guildMemberAdd'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberAdd', cluster.logger, async (_, member) => {
            await Promise.all([
                this.cluster.database.users.upsert(member.user),
                this.cluster.moderation.eventLog.userJoined(member),
                this.cluster.greetings.greet(member)
            ]);
        });
    }
}
