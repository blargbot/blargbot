import templates from '@blargbot/cluster/text';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { BaseService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';
import moment from 'moment-timezone';

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
            void this.master.util.send(restart.varvalue.channel, new FormattableMessageContent({
                content: templates.respawn.success({ duration: moment.duration(moment().diff(restart.varvalue.time)) })
            }));
            void this.master.database.vars.delete('restart');
        }
    }

    public async stop(): Promise<void> {
        await this.master.clusters.killAll();
    }

}
