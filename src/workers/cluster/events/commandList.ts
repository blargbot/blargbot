import { Cluster } from '../Cluster';
import { ClusterEventService, ProcessMessageHandler, CommandListResult } from '../core';

export class CommandListHandler extends ClusterEventService {
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
                usage: c.usage,
                info: c.info,
                category: c.category,
                aliases: c.aliases,
                flags: c.flags,
                onlyOn: c.onlyOn
            };
        }
        reply(commands);
    }
}
