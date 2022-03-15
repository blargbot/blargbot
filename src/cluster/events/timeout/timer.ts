import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/core/types';
import moment from 'moment-timezone';

export class TimeoutTimerEventService extends TimeoutEventService<'timer'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'timer', cluster.logger);
    }
    public async execute(event: StoredEvent<'timer'>): Promise<void> {
        const startTime = moment(event.starttime);
        await this.cluster.util.send(event.channel, {
            content: `⏰ *Bzzt!* <@${event.user}>, the timer you set <t:${startTime.unix()}:R> has gone off! *Bzzt!* ⏰`,
            allowedMentions: { users: [event.user] }
        });
    }
}
