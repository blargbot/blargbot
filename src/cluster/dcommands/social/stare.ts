import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class StareCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`stare`, {
            search: `stare`,
            action: `stares`,
            description: `Staaaaaaaaare`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
