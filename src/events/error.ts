import { Cluster } from "../cluster";
import { BaseEventHandler } from "../structures/BaseEventHandler";

export class ErrorEventHandler extends BaseEventHandler {
    constructor(cluster: Cluster) {
        super(cluster.discord, 'error', cluster.logger);
    }

    handle(error: Error) {
        if (error.message.indexOf('Message.guild') == -1)
            this.logger.error(error);
    }
}

module.exports = { ErrorEventHandler };