import { Cluster } from '@cluster';
import { DiscordEventService } from '@core/serviceTypes';

export class DiscordWarnHandler extends DiscordEventService<'warn'> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'warn', cluster.logger);
    }

    public execute(message: string): void {
        this.logger.warn(message);
    }
}
