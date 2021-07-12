import moment from 'moment';
import { Cluster } from '../Cluster';
import { StoredEvent, TimeoutEventService } from '../core';

export class TimeoutTimerEventService extends TimeoutEventService<'timer'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'timer', cluster.logger);
    }
    protected async execute(event: StoredEvent<'timer'>): Promise<void> {
        const duration = moment(event.starttime).fromNow();
        await this.cluster.util.send(event.channel, {
            content: `⏰ *Bzzt!* <@${event.user}>, the timer you set ${duration} has gone off! *Bzzt!* ⏰`,
            allowedMentions: { users: [event.user] }
        });
    }
}
