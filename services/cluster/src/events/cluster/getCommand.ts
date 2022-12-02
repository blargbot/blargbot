import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes/index.js';
import { CommandListResultItem } from '@blargbot/cluster/types.js';
import { format } from '@blargbot/formatting';

export class ClusterGetCommandHandler extends ClusterEventService<'getCommand'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommand', async ({ data, reply }) => reply(await this.getCommand(data)));
    }

    public async getCommand(name: string): Promise<CommandListResultItem | undefined> {
        const formatter = await this.cluster.util.getFormatter();
        const result = await this.cluster.commands.default.get(name);
        if (result.state !== 'ALLOWED')
            return undefined;

        const command = result.detail.command;

        return {
            aliases: command.aliases,
            category: command.category.id,
            description: command.description?.[format](formatter),
            disabled: command.disabled,
            flags: command.flags.map(f => ({
                ...f,
                description: typeof f.description === 'string' ? f.description : f.description[format](formatter)
            })),
            hidden: command.hidden,
            name: command.name,
            permission: command.permission,
            roles: command.roles,
            signatures: command.signatures.map(s => ({
                ...s,
                description: s.description[format](formatter)
            }))
        };
    }
}
