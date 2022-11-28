import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class SleepyCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('sleepy', {
            search: 'sleepy',
            ...templates.commands.sleepy,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
