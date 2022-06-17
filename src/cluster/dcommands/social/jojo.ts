import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class JojoCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('jojo', {
            search: 'jojo',
            description: 'This must be the work of an enemy stand!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
