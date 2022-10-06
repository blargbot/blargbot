import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import moment from 'moment-timezone';

export class RestartCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `restart`,
            category: CommandType.DEVELOPER,
            description: `Restarts blargbot, or one of its components`,
            definitions: [
                {
                    parameters: ``,
                    execute: (ctx) => this.#respawnClusters(ctx),
                    description: `Restarts all the clusters`
                },
                {
                    parameters: `kill`,
                    execute: (ctx) => this.#restart(ctx),
                    description: `Kills the master process, ready for pm2 to restart it`
                },
                {
                    parameters: `api`,
                    execute: (ctx) => this.#restartWebsites(ctx),
                    description: `Restarts the api process`
                }
            ]
        });
    }

    async #restartWebsites(context: CommandContext): Promise<string> {
        await context.cluster.worker.request(`respawnApi`, undefined, 60000);
        return this.success(`Api has been respawned.`);
    }

    async #restart(context: CommandContext): Promise<undefined> {
        await context.reply(`Ah! You've killed me! D:`);
        await context.database.vars.set(`restart`, {
            varvalue: {
                channel: context.channel.id,
                time: moment().valueOf()
            }
        });
        context.cluster.worker.send(`killAll`, undefined);
        return undefined;
    }

    #respawnClusters(context: CommandContext): string {
        context.cluster.worker.send(`respawnAll`, { channelId: context.channel.id });
        return `Ah! You've killed me but in a way that minimizes downtime! D:`;
    }
}
