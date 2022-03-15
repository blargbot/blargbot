import { Logger } from '@blargbot/core/Logger';
import { WorkerConnection } from '@blargbot/core/worker';

import { ClusterIPCContract } from './types';

export class ClusterConnection extends WorkerConnection<ClusterIPCContract> {
    public constructor(
        id: number,
        public readonly shardRange: [number, number],
        shardCount: number,
        logger: Logger
    ) {
        super(id, '@blargbot/cluster', require.resolve('@blargbot/cluster'), logger);
        this.args.push('--max-old-space-size=4096');
        this.env.CLUSTER_ID = id.toString();
        this.env.SHARDS_MAX = shardCount.toString();
        this.env.SHARDS_FIRST = shardRange[0].toString();
        this.env.SHARDS_LAST = shardRange[1].toString();
    }
}
