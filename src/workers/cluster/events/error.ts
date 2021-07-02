import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class ErrorHandler extends DiscordEventService<'error'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'error', cluster.logger);
    }

    public execute(error: Error): void {
        if (error.message.indexOf('Message.guild') == -1)
            this.logger.error(error);
    }
}