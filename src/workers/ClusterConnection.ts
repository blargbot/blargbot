import { WorkerConnection } from './core/WorkerConnection';
import { ClusterStats } from './ClusterTypes';

export class ClusterConnection extends WorkerConnection {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #stats?: ClusterStats;
    public get stats(): ClusterStats | undefined { return this.#stats; }

    public constructor(
        id: number,
        public readonly shardRange: [number, number],
        shardCount: number,
        logger: CatLogger
    ) {
        super(id, 'cluster', logger);
        this.args.push('--max-old-space-size=4096');
        this.env.CLUSTER_ID = id.toString();
        this.env.SHARDS_MAX = shardCount.toString();
        this.env.SHARDS_FIRST = shardRange[0].toString();
        this.env.SHARDS_LAST = shardRange[1].toString();

        this.on('clusterStats', stats => this.#stats = stats);
    }
}