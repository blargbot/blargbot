import { Cluster } from '../Cluster';
import { ClusterEventService, ProcessMessageHandler, CommandListResult } from '../core';

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
