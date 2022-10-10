import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { ClusterRespawnRequest, CommandResult } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';

const cmd = templates.commands.respawn;

export class RespawnCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `respawn`,
            category: CommandType.STAFF,
            description: cmd.description,
            definitions: [
                {
                    parameters: `{clusterId:integer}`,
                    execute: (ctx, [clusterId]) => this.respawn(ctx, clusterId.asInteger),
                    description: cmd.default.description
                }
            ]
        });
    }

    public async respawn(context: CommandContext, clusterId: number): Promise<CommandResult> {
        await context.send(context.config.discord.channels.shardlog, cmd.default.requested({ user: context.author, clusterId }));
        context.cluster.worker.send(`respawn`, <ClusterRespawnRequest>{ id: clusterId, channel: context.channel.id });
        return cmd.default.success({ clusterId });
    }
}
