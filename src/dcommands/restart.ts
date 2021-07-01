import { Cluster } from '../cluster';
import { commandTypes } from '../utils';
import { BaseGlobalCommand, CommandContext } from '../core/command';
import moment from 'moment';

export class RestartCommand extends BaseGlobalCommand {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'restart',
            category: commandTypes.DEVELOPER,
            info: 'Restarts blargbot, or one of its components',
            definition: {
                execute: (ctx) => this.respawnClusters(ctx),
                description: 'Restarts all the clusters',
                subcommands: {
                    'kill': {
                        execute: (ctx) => this.restart(ctx),
                        description: 'Restarts all the clusters'
                    },
                    'frontend': {
                        execute: (ctx) => this.restartWebsites(ctx),
                        description: 'Restarts all the clusters'
                    }
                }
            }
        });
    }

    private async restartWebsites(ctx: CommandContext): Promise<void> {
        await this.cluster.util.send(ctx, 'Frontend has been respawned.');
        this.cluster.worker.send('respawnFrontend', ctx.channel.id);
    }

    private async restart(ctx: CommandContext): Promise<void> {
        await this.cluster.util.send(ctx, 'Ah! You\'ve killed me! D:');
        await this.cluster.database.vars.set<'restart'>({
            varname: 'restart',
            varvalue: {
                channel: ctx.channel.id,
                time: moment().valueOf()
            }
        });
        this.cluster.worker.send('killAll', ctx.channel.id);
    }

    private async respawnClusters(ctx: CommandContext): Promise<void> {
        await this.cluster.util.send(ctx, 'Ah! You\'ve killed me but in a way that minimizes downtime! D:');
        this.cluster.worker.send('respawnAll', ctx.channel.id);
    }
}