import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class DanceCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`dance`, {
            search: `dance`,
            action: `dances`,
            description: `Break out some sweet, sweet dance moves.`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
