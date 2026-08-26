import type { Configuration } from '@blargbot/config';
import { BaseWorker } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';
import type { MasterIPCContract, MasterOptions } from '@blargbot/master/types.js';
import type $fetch from 'node-fetch';

import { Master } from './Master.js';

export class MasterWorker extends BaseWorker<MasterIPCContract> {
    public readonly master: Master;

    public constructor(
        logger: Logger,
        config: Configuration,
        fetch: typeof $fetch,
        options: Omit<MasterOptions, 'worker'>
    ) {
        super(logger);

        logger.info(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

MAIN PROCESS INITIALIZED

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`);

        this.master = new Master(logger, config, fetch, { ...options, worker: this });
    }

    public async start(): Promise<void> {
        await this.master.start();
        await super.start();
    }
}
