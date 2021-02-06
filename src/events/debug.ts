import { Cluster } from "../cluster";
import { BaseEventHandler } from "../structures/BaseEventHandler";

process.cpuUsage().system

export class DebugEventHandler extends BaseEventHandler {
    constructor(cluster: Cluster) {
        super(cluster.discord, 'debug', cluster.logger);
    }

    handle(message: any) {
        this.logger.debug(message);
    }
}