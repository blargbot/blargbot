import { Cluster } from '../Cluster';
import { DiscordEventService } from '@cluster/core';

export class DiscordWarnHandler extends DiscordEventService<'warn'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'warn', cluster.logger);
    }

    public execute(message: string): void {
        this.logger.warn(message);
    }
}
