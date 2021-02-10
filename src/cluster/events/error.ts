import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';

export class ErrorEventHandler extends DiscordEventService {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'error', cluster.logger);
    }

    public execute(error: Error): void {
        if (error.message.indexOf('Message.guild') == -1)
            this.logger.error(error);
    }
}