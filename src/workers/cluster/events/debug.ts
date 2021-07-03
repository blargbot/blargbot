import { Cluster } from '../Cluster';
import { DiscordEventService } from '../core';

export class DebugHandler extends DiscordEventService<'debug'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger);
    }

    public execute(message: string): void {
        this.logger.debug(message);
    }
}
