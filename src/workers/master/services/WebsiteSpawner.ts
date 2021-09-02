import { BaseService } from '@core/serviceTypes';
import { Master } from '@master';

export class WebsiteSpawner extends BaseService {
    public readonly type = 'website';

    public constructor(
        public readonly master: Master
    ) {
        super();
    }

    public async start(): Promise<void> {
        await this.master.api.spawnAll();
        this.master.logger.info('The website is spawned!');
    }

    public async stop(): Promise<void> {
        await this.master.api.killAll();
    }

}
