import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class PokeCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`poke`, {
            search: `poke`,
            action: `pokes`,
            user: true,
            description: `Gives somebody a poke.`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
