import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';

export class DiscordErrorHandler extends DiscordEventService<'error'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'error', cluster.logger, err => this.execute(err));
    }

    public execute(error: Error): void {
        if (!error.message.includes('Message.guild'))
            this.logger.error(error);
    }
}
