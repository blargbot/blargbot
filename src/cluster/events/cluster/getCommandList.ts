import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { CommandListResult } from '@blargbot/cluster/types';
import { format } from '@blargbot/domain/messages/types';

export class ClusterGetCommandListHandler extends ClusterEventService<'getCommandList'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getCommandList', async ({ reply }) => reply(await this.getCommandList()));
    }

    public async getCommandList(): Promise<CommandListResult> {
        const commands: CommandListResult = {};
        const formatter = await this.cluster.util.getFormatter();
        for await (const result of this.cluster.commands.default.list()) {
            if (result.state !== 'ALLOWED')
                continue;

            const c = result.detail.command;
            commands[c.name] = {
                aliases: c.aliases,
                category: c.category.id,
                description: c.description?.[format](formatter),
                disabled: c.disabled,
                flags: c.flags.map(f => ({
                    ...f,
                    description: typeof f.description === 'string' ? f.description : f.description[format](formatter)
                })),
                hidden: c.hidden,
                name: c.name,
                permission: c.permission,
                roles: c.roles,
                signatures: c.signatures.map(s => ({
                    ...s,
                    description: s.description[format](formatter)
                }))
            };
        }
        return commands;
    }
}
