import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import moment from 'moment';

export class RestartCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'restart',
            category: CommandType.DEVELOPER,
            description: 'Restarts blargbot, or one of its components',
            definitions: [
                {
                    parameters: '',
                    execute: (ctx) => this.respawnClusters(ctx),
                    description: 'Restarts all the clusters'
                },
                {
                    parameters: 'kill',
                    execute: (ctx) => this.restart(ctx),
                    description: 'Restarts all the clusters'
                },
                {
                    parameters: 'frontend',
                    execute: (ctx) => this.restartWebsites(ctx),
                    description: 'Restarts all the clusters'
                }
            ]
        });
    }

    private async restartWebsites(context: CommandContext): Promise<void> {
        await context.util.send(context, 'Frontend has been respawned.');
        context.cluster.worker.send('respawnFrontend', context.channel.id);
    }

    private async restart(context: CommandContext): Promise<void> {
        await context.util.send(context, 'Ah! You\'ve killed me! D:');
        await context.database.vars.set<'restart'>({
            varname: 'restart',
            varvalue: {
                channel: context.channel.id,
                time: moment().valueOf()
            }
        });
        context.cluster.worker.send('killAll', context.channel.id);
    }

    private async respawnClusters(context: CommandContext): Promise<void> {
        await context.util.send(context, 'Ah! You\'ve killed me but in a way that minimizes downtime! D:');
        context.cluster.worker.send('respawnAll', context.channel.id);
    }
}
