import { Cluster } from '@blargbot/cluster';
import { IntervalService } from '@blargbot/core/serviceTypes';

export class DomainWhitelistInterval extends IntervalService {
    public readonly type: string = `bbtag`;
    #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super(15, `minutes`, cluster.logger, true);
        this.#cluster = cluster;
    }

    public async execute(): Promise<void> {
        await this.#cluster.domains.refresh();
    }
}
