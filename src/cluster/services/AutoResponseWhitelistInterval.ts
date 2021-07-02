import { IntervalService } from '../../structures/IntervalService';
import { Cluster } from '../Cluster';

export class AutoResponseWhitelistInterval extends IntervalService {
    public readonly type: string = 'bbtag';

    public constructor(private readonly cluster: Cluster) {
        super(15, 'minutes', cluster.logger, true);
    }

    protected async execute(): Promise<void> {
        await this.cluster.autoresponses.refresh();
    }
}