import { WorkerConnection } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';

import { entrypoint } from './index.js';
import type { ClusterIPCContract } from './types.js';

export class ClusterConnection extends WorkerConnection<ClusterIPCContract> {
    public constructor(
        id: number,
        public readonly shardRange: [number, number],
        shardCount: number,
        maxMemory: number,
        logger: Logger
    ) {
        super(id, '@blargbot/cluster', entrypoint, logger);
        this.args.push(`--max-old-space-size=${maxMemory}`);
        this.env.CLUSTER_ID = id.toString();
        this.env.SHARDS_MAX = shardCount.toString();
        this.env.SHARDS_FIRST = shardRange[0].toString();
        this.env.SHARDS_LAST = shardRange[1].toString();
    }
}
