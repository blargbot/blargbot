import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordErrorHandler extends DiscordEventService<'error'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'error', cluster.logger, err => this.execute(err));
    }

    public execute(error: Error): void {
        if (!error.message.includes('Message.guild'))
            this.logger.error(error);
    }
}
