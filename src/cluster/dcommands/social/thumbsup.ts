import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class ThumbsupCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('thumbsup', {
            search: 'thumbsup',
            action: 'gives a thumbs up',
            description: 'Give a thumbs up!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
