import { Cluster } from '../Cluster';
import { DiscordEventService } from '@cluster/core';

export class DiscordDebugHandler extends DiscordEventService<'debug'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger);
    }

    public execute(message: string): void {
        this.logger.debug(message);
    }
}
