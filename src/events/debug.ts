import { Cluster } from '../cluster';
import { BaseEventHandler } from '../structures/BaseEventHandler';

export class DebugEventHandler extends BaseEventHandler<[unknown]> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger);
    }

    public handle(message: unknown): void {
        this.logger.debug(message);
    }
}