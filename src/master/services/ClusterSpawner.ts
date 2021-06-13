import moment from 'moment';
import { BaseService } from '../../structures/BaseService';
import { humanize } from '../../utils';
import { Master } from '../Master';

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

        if (restart?.varvalue) {
            void this.master.util.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + humanize.duration(moment(), moment(restart.varvalue.time)) + '.');
            void this.master.database.vars.delete('restart');
        }
    }

    public stop(): void {
        this.master.clusters.killAll();
    }

}