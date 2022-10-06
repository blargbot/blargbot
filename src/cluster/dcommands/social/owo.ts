import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class OwoCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`owo`, {
            search: `owo`,
            action: `owos`,
            description: `owo whats this?`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
