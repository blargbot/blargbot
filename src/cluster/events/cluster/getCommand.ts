import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { ICommandDetails } from '@blargbot/cluster/types';

export class ClusterGetCommandHandler extends ClusterEventService<'getCommand'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommand', async ({ data, reply }) => reply(await this.getCommand(data)));
    }

    public async getCommand(name: string): Promise<ICommandDetails | undefined> {
        const result = await this.cluster.commands.default.get(name);
        if (result.state !== 'ALLOWED')
            return undefined;

        const command = result.detail.command;

        return {
            aliases: command.aliases,
            category: command.category,
            description: command.description,
            disabled: command.disabled,
            flags: command.flags,
            hidden: command.hidden,
            name: command.name,
            permission: command.permission,
            roles: command.roles,
            signatures: command.signatures
        };
    }
}
