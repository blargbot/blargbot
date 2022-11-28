import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class JojoCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('jojo', {
            search: 'jojo',
            ...templates.commands.jojo,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
