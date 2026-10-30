import type { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core';

export class DiscordWarnHandler extends DiscordEventService<'warn'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'warn', cluster.logger, (msg) => this.logger.warn(msg));
    }
}
