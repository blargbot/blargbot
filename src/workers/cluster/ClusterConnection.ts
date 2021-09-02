import { Logger } from '@core/Logger';
import { WorkerConnection } from '@core/worker';

export class ClusterConnection extends WorkerConnection<'cluster'> {

    public constructor(
        id: number,
        public readonly shardRange: [number, number],
        shardCount: number,
        logger: Logger
    ) {
        super(id, 'cluster', logger);
        this.args.push('--max-old-space-size=4096');
        this.env.CLUSTER_ID = id.toString();
        this.env.SHARDS_MAX = shardCount.toString();
        this.env.SHARDS_FIRST = shardRange[0].toString();
        this.env.SHARDS_LAST = shardRange[1].toString();
    }
}
