import { BaseService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ApiSpawner extends BaseService {
    public readonly type = 'api';

    public constructor(
        public readonly master: Master
    ) {
        super();
    }

    public async start(): Promise<void> {
        await this.master.api.spawnAll();
        this.master.logger.info('The api is spawned!');
    }

    public async stop(): Promise<void> {
        await this.master.api.killAll();
    }

}
