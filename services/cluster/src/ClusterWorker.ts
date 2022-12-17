import type { Configuration } from '@blargbot/config';
import { BaseWorker } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';
import res from '@blargbot/res';

import { Cluster } from './Cluster.js';
import type { ClusterIPCContract } from './types.js';

const holidays = await res.holidays.load();

export class ClusterWorker extends BaseWorker<ClusterIPCContract> {
    public readonly cluster: Cluster;

    public constructor(
        logger: Logger,
        public readonly config: Configuration
    ) {
        super(logger);
        const clusterId = envNumber(this.env, 'CLUSTER_ID');

        this.logger.init(`CLUSTER ${clusterId} (pid ${this.id}) PROCESS INITIALIZED`);

        this.cluster = new Cluster(this, logger, config, {
            id: clusterId,
            shardCount: envNumber(this.env, 'SHARDS_MAX'),
            firstShardId: envNumber(this.env, 'SHARDS_FIRST'),
            lastShardId: envNumber(this.env, 'SHARDS_LAST'),
            holidays
        });
    }

    public async start(): Promise<void> {
        await this.cluster.start();
        super.start();
    }

    public async stop(): Promise<void> {
        await super.stop();
    }
}

function envNumber(env: NodeJS.ProcessEnv, key: string): number {
    const res = env[key];
    switch (typeof res) {
        case 'number': return res;
        case 'string': {
            const num = parseInt(res);
            if (Number.isNaN(num))
                throw new Error(`Environment variable ${key} is expected to be a number`);
            return num;
        }
    }

    throw new Error(`Missing reqired environment variable ${key}`);
}
