import { CommandContext, GlobalCommand } from '../../command/index';
import { CommandType } from '@blargbot/cluster/utils';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.restart;

export class RestartCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'restart',
            category: CommandType.DEVELOPER,
            description: cmd.description,
            definitions: [
                {
                    parameters: '',
                    execute: (ctx) => this.respawnClusters(ctx),
                    description: cmd.default.description
                },
                {
                    parameters: 'kill',
                    execute: (ctx) => this.restart(ctx),
                    description: cmd.kill.description
                },
                {
                    parameters: 'api',
                    execute: (ctx) => this.restartWebsites(ctx),
                    description: cmd.api.description
                }
            ]
        });
    }

    public async restartWebsites(context: CommandContext): Promise<CommandResult> {
        await context.cluster.worker.request('respawnApi', undefined, 60000);
        return cmd.api.success;
    }

    public async restart(context: CommandContext): Promise<CommandResult> {
        await context.reply(cmd.kill.success);
        await context.database.vars.set('restart', {
            varvalue: {
                channel: context.channel.id,
                time: moment().valueOf()
            }
        });
        context.cluster.worker.send('killAll', undefined);
        return undefined;
    }

    public respawnClusters(context: CommandContext): CommandResult {
        context.cluster.worker.send('respawnAll', { channelId: context.channel.id });
        return cmd.default.success;
    }
}
