import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { CommandListResult } from '@cluster/types';
import { mapping } from '@core/utils';

export class ClusterGetCommandListHandler extends ClusterEventService<unknown, CommandListResult> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommandList', mapping.mapUnknown, ({ reply }) => reply(this.getCommandList()));
    }

    public getCommandList(): CommandListResult {
        const commands: CommandListResult = {};
        for (const c of this.cluster.commands.list()) {
            commands[c.name] = {
                name: c.name,
                description: c.description,
                category: c.category,
                aliases: c.aliases,
                flags: c.flags,
                onlyOn: c.onlyOn,
                signatures: c.signatures,
                cannotDisable: c.cannotDisable,
                hidden: c.hidden
            };
        }
        return commands;
    }
}
