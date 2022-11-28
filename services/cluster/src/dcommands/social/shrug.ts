import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class ShrugCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('shrug', {
            search: 'shrug',
            ...templates.commands.shrug,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
