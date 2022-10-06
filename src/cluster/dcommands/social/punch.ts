import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class PunchCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`punch`, {
            search: `punch`,
            action: `punches`,
            user: true,
            description: `Punch someone. They probably deserved it.`,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
