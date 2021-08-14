import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class ThumbsupCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('thumbsup', 'thumbsup', 'gives a thumbs up', 'self', 'Give a thumbs up!', cluster.config.general.wolke);
    }
}
