import { Cluster } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core/serviceTypes/index.js';

export class BotStaffWhitelistInterval extends IntervalService {
    public readonly type: string = 'bot';
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super(1, 'day', cluster.logger, true);
        this.#cluster = cluster;
    }

    public async execute(): Promise<void> {
        await this.#cluster.botStaff.refresh();
    }
}
