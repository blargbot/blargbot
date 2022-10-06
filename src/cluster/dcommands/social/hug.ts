import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class HugCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`hug`, {
            search: `hug`,
            action: `hugs`,
            user: true,
            description: `Give somebody a hug.`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
