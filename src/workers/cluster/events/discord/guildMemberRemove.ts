import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';
import { Member } from 'eris';

export class DiscordGuildMemeberRemoveHandler extends DiscordEventService<'guildMemberRemove'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberRemove', cluster.logger, async (guild, _member) => {
            const member = _member instanceof Member ? _member : new Member({ ..._member }, guild, cluster.discord);
            await Promise.all([
                this.cluster.moderation.bans.userLeft(member),
                this.cluster.moderation.eventLog.userLeft(member),
                this.cluster.greetings.farewell(member)
            ]);
        });
    }
}
