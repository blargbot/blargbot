import { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes';
import { StoredEvent } from '@blargbot/core/types';
import moment from 'moment';

export class TimeoutRemindEventService extends TimeoutEventService<'remind'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'remind', cluster.logger);
    }
    public async execute(event: StoredEvent<'remind'>): Promise<void> {
        const startTime = moment(event.starttime);
        await this.cluster.util.send(event.channel, {
            content: `⏰ Hi, <@${event.user}>! You asked me to remind you about this <t:${startTime.unix()}:R>:\n${event.content}`,
            allowedMentions: { users: [event.user] }
        });
    }
}
