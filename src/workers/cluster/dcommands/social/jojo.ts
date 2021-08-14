import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class JojoCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('jojo', {
            search: 'jojo',
            description: 'This must be the work of an enemy stand!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
