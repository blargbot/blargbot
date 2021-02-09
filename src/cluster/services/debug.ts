import { Cluster } from '..';
import { DiscordEventService } from '../../structures/DiscordEventService';

export class DebugEventHandler extends DiscordEventService {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger);
    }

    public execute(message: unknown): void {
        this.logger.debug(message);
    }
}