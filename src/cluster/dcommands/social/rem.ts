import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class RemCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`rem`, {
            search: `rem`,
            description: `Worst girl.`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
