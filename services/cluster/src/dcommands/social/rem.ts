import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class RemCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('rem', {
            search: 'rem',
            ...templates.commands.rem,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
