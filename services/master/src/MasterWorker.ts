import type { Configuration } from '@blargbot/config/Configuration.js';
import { BaseWorker } from '@blargbot/core/worker/index.js';
import type { Logger } from '@blargbot/logger';
import type { MasterIPCContract, MasterOptions } from '@blargbot/master/types.js';

import { Master } from './Master.js';

export class MasterWorker extends BaseWorker<MasterIPCContract> {
    public readonly master: Master;

    public constructor(
        logger: Logger,
        config: Configuration,
        options: Omit<MasterOptions, 'worker'>
    ) {
        super(logger);

        this.master = new Master(logger, config, { ...options, worker: this });
    }

    public async start(): Promise<void> {
        console.log(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

MAIN PROCESS INITIALIZED

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`);
        await this.master.start();
        super.start();
    }
}
