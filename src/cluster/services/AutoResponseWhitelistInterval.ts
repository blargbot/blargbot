import { Cluster } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core/serviceTypes';

export class AutoResponseWhitelistInterval extends IntervalService {
    public readonly type: string = `bbtag`;
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super(15, `minutes`, cluster.logger, true);
        this.#cluster = cluster;
    }

    public async execute(): Promise<void> {
        await this.#cluster.autoresponses.refresh();
    }
}
