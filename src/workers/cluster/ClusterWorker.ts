import { Logger } from '@core/Logger';
import { BaseWorker } from '@core/worker';

import { Cluster } from './Cluster';

export class ClusterWorker extends BaseWorker {
    public readonly cluster: Cluster;

    public constructor(
        logger: Logger,
        public readonly config: Configuration
    ) {
        super(logger);
        const clusterId = envNumber(this.env, 'CLUSTER_ID');

        this.logger.init(`CLUSTER ${clusterId} (pid ${this.id}) PROCESS INITIALIZED`);

        this.cluster = new Cluster(logger, config, {
            id: clusterId,
            worker: this,
            shardCount: envNumber(this.env, 'SHARDS_MAX'),
            firstShardId: envNumber(this.env, 'SHARDS_FIRST'),
            lastShardId: envNumber(this.env, 'SHARDS_LAST')
        });
    }

    public async start(): Promise<void> {
        await this.cluster.start();
        super.start();
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
