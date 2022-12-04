import type { Cluster } from '@blargbot/cluster';
import { TimeoutEventService } from '@blargbot/cluster/serviceTypes/index.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import type { StoredEvent } from '@blargbot/domain/models/index.js';
import moment from 'moment-timezone';

import templates from '../../text.js';

export class TimeoutTimerEventService extends TimeoutEventService<'timer'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.timeouts, 'timer', cluster.logger);
    }
    public async execute(event: StoredEvent<'timer'>): Promise<void> {
        await this.cluster.util.send(event.channel, new FormattableMessageContent({
            content: templates.commands.timer.default.event({
                userId: event.user,
                start: moment(event.starttime)
            }),
            allowedMentions: { users: [event.user] }
        }));
    }
}
