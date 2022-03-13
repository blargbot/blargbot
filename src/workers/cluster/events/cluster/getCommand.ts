import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { ICommandDetails } from '@cluster/types';

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

        return {
            aliases: result.detail.aliases,
            category: result.detail.category,
            description: result.detail.description,
            disabled: result.detail.disabled,
            flags: result.detail.flags,
            hidden: result.detail.hidden,
            name: result.detail.name,
            permission: result.detail.permission,
            roles: result.detail.roles,
            signatures: result.detail.signatures
        };
    }
}
