import { Cluster } from '../cluster';
import { BaseEventHandler } from '../structures/BaseEventHandler';

export class ErrorEventHandler extends BaseEventHandler<[Error]> {
    public constructor(cluster: Cluster) {
        super(cluster.discord, 'error', cluster.logger);
    }

    public handle(error: Error): void {
        if (error.message.indexOf('Message.guild') == -1)
            this.logger.error(error);
    }
}