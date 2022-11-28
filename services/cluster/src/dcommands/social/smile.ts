import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class SmileCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('smile', {
            search: 'smile',
            ...templates.commands.smile,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
