import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PokeCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('poke', 'poke', 'pokes', 'user', 'Gives somebody a poke.', cluster.config.general.wolke);
    }
}
