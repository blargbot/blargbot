import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class AwooCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`awoo`, {
            search: `awoo`,
            ...templates.commands.awoo,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
