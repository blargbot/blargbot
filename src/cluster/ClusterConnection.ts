import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { WorkerConnection } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';

import type { ClusterIPCContract } from './types.js';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

export class ClusterConnection extends WorkerConnection<ClusterIPCContract> {
    public constructor(
        id: number,
        public readonly shardRange: [number, number],
        shardCount: number,
        maxMemory: number,
        logger: Logger
    ) {
        super(id, '@blargbot/cluster', path.resolve(thisDir, 'start.js'), logger);
        this.args.push(`--max-old-space-size=${maxMemory}`);
        this.env.CLUSTER_ID = id.toString();
        this.env.SHARDS_MAX = shardCount.toString();
        this.env.SHARDS_FIRST = shardRange[0].toString();
        this.env.SHARDS_LAST = shardRange[1].toString();
    }
}
