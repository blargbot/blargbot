import { Configuration } from '@blargbot/config';
import { BaseWorker } from '@blargbot/core/worker';
import { Logger } from '@blargbot/logger';
import holidays from '@blargbot/res/holidays.json';

import { Cluster } from './Cluster';
import { ClusterIPCContract } from './types';

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
        await this.cluster.images.killAll();
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
