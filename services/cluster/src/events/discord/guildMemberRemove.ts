import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';
import * as Eris from 'eris';

export class DiscordGuildMemeberRemoveHandler extends DiscordEventService<'guildMemberRemove'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberRemove', cluster.logger, async (guild, _member) => {
            const member = _member instanceof Eris.Member ? _member : new Eris.Member({ ..._member }, guild, cluster.discord);
            await Promise.all([
                this.cluster.moderation.bans.userLeft(member),
                this.cluster.moderation.eventLog.userLeft(member),
                this.cluster.greetings.farewell(member)
            ]);
        });
    }
}
