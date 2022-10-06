import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class PatCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`pat`, {
            search: `pat`,
            action: `pats`,
            user: true,
            description: `Give somebody a lovely pat.`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
