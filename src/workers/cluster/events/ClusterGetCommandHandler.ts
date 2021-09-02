import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { CommandDetails } from '@cluster/types';
import { mapping } from '@core/utils';

export class ClusterGetCommandHandler extends ClusterEventService<string, CommandDetails | undefined> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommand', mapping.mapString, ({ data, reply }) => reply(this.getCommand(data)));
    }

    public getCommand(name: string): CommandDetails | undefined {
        const command = this.cluster.commands.get(name);
        if (command === undefined)
            return undefined;

        return {
            name: command.name,
            description: command.description,
            category: command.category,
            aliases: command.aliases,
            flags: command.flags,
            onlyOn: command.onlyOn,
            signatures: command.signatures,
            cannotDisable: command.cannotDisable,
            hidden: command.hidden
        };
    }
}
