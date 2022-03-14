import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordDebugHandler extends DiscordEventService<'debug'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger, msg => this.logger.debug(msg));
    }
}
