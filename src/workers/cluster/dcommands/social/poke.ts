import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PokeCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('poke', {
            search: 'poke',
            action: 'pokes',
            user: true,
            description: 'Gives somebody a poke.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
