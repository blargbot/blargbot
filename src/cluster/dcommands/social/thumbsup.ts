import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class ThumbsupCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('thumbsup', {
            search: 'thumbsup',
            action: 'gives a thumbs up',
            description: 'Give a thumbs up!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
