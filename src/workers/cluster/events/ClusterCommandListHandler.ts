import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { CommandListResult } from '@cluster/types';
import { ProcessMessageHandler } from '@core/types';

export class ClusterCommandListHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'commandList');
    }

    protected execute([, , reply]: Parameters<ProcessMessageHandler>): void {
        const commands: CommandListResult = {};
        for (const c of this.cluster.commands.list()) {
            commands[c.name] = {
                name: c.name,
                info: c.description,
                category: c.category,
                aliases: c.aliases,
                flags: c.flags,
                onlyOn: c.onlyOn,
                signatures: c.signatures
            };
        }
        reply(commands);
    }
}
