import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { CommandDetails } from '@cluster/types';
import { ProcessMessageHandler } from '@core/types';

export class ClusterGetCommandHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommand');
    }

    protected execute(...[name, , reply]: Parameters<ProcessMessageHandler>): void {
        const command = this.cluster.commands.get(name as string);
        if (command === undefined)
            return reply(undefined);

        return reply<CommandDetails>({
            name: command.name,
            description: command.description,
            category: command.category,
            aliases: command.aliases,
            flags: command.flags,
            onlyOn: command.onlyOn,
            signatures: command.signatures,
            cannotDisable: command.cannotDisable,
            hidden: command.hidden
        });
    }
}
