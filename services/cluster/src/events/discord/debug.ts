import { Cluster } from '@blargbot/cluster';
import { DiscordEventService } from '@blargbot/core/serviceTypes/index.js';

export class DiscordDebugHandler extends DiscordEventService<'debug'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger, msg => this.logger.debug(msg));
    }
}
