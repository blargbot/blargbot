import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class OwoCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('owo', 'owo', 'owos', 'self', 'owo whats this?', cluster.config.general.wolke);
    }
}
