import { BaseService } from '@core/serviceTypes';
import { humanize } from '@core/utils';
import { Master } from '@master';
import moment from 'moment';

export class ClusterSpawner extends BaseService {
    public readonly type = 'cluster';

    public constructor(
        public readonly master: Master
    ) {
        super();
    }

    public async start(): Promise<void> {
        await this.master.clusters.spawnAll();
        this.master.logger.info('All clusters are spawned!');

        const restart = await this.master.database.vars.get('restart');

        if (restart?.varvalue !== undefined) {
            void this.master.util.send(restart.varvalue.channel, `Ok I'm back. It took me ${humanize.duration(moment(), moment(restart.varvalue.time))}.`);
            void this.master.database.vars.delete('restart');
        }
    }

    public async stop(): Promise<void> {
        await this.master.clusters.killAll();
    }

}