import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { ICommandDetails } from '@cluster/types';
import { mapping } from '@core/utils';

export class ClusterGetCommandHandler extends ClusterEventService<string, ICommandDetails | undefined> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommand', mapping.mapString, async ({ data, reply }) => reply(await this.getCommand(data)));
    }

    public async getCommand(name: string): Promise<ICommandDetails | undefined> {
        const result = await this.cluster.commands.default.get(name);
        if (result.state !== 'ALLOWED')
            return undefined;

        // eslint-disable-next-line @typescript-eslint/unbound-method
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
