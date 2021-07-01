import moment from 'moment';
import { BaseClient } from '../core/BaseClient';
import { ClusterPool } from '../workers/ClusterPool';
import snekfetch from 'snekfetch';
import { BaseService } from '../structures/BaseService';
import { ModuleLoader } from '../core/ModuleLoader';

export class Master extends BaseClient {
    public readonly clusters: ClusterPool;
    public readonly eventHandlers: ModuleLoader<BaseService>;
    public readonly services: ModuleLoader<BaseService>;

    public constructor(
        logger: CatLogger,
        config: Configuration,
        options: MasterOptions
    ) {
        super(logger, config, {});
        this.clusters = new ClusterPool(this.config.shards, this.logger);
        this.eventHandlers = new ModuleLoader('master/events', BaseService, [this, options], this.logger, e => e.name);
        this.services = new ModuleLoader('master/services', BaseService, [this, options], this.logger, e => e.name);
        // TODO Add websites

        this.services.on('add', (module: BaseService) => void module.start());
        this.services.on('remove', (module: BaseService) => void module.stop());
        this.eventHandlers.on('add', (module: BaseService) => void module.start());
        this.eventHandlers.on('remove', (module: BaseService) => void module.stop());
    }

    public async start(): Promise<void> {
        await this.eventHandlers.init();
        this.logger.init(this.moduleStats(this.eventHandlers, 'Events', ev => ev.type));

        await Promise.all([
            super.start(),
            this.hello()
        ]);

        await this.services.init();
        this.logger.init(this.moduleStats(this.services, 'Services', ev => ev.type));
    }

    private async hello(): Promise<void> {
        try {
            await snekfetch.post(`https://discordapp.com/api/channels/${this.config.discord.channels.botlog}/messages`)
                .set('Authorization', this.config.discord.token)
                .send({ content: `My master process just initialized on \`${moment().format('MMMM Do, YYYY[` at `]hh:mm:ss.SS')}\`.` });
        } catch (err) {
            this.logger.error('Could not post startup message', err);
        }
    }
    public async eval(author: string, text: string): Promise<{ success: boolean, result: unknown }> {
        if (author !== this.config.discord.users.owner)
            throw new Error(`User ${author} does not have permission to run eval`);

        try {
            const func: () => Promise<unknown>
                = eval(text.split('\n').length === 1
                    ? `async () => ${text}`
                    : `async () => { ${text} }`);
            return { success: true, result: await func.call(this) };
        } catch (err) {
            return { success: false, result: err };
        }
    }
}

export interface MasterOptions {
    readonly avatars: readonly string[];
    readonly holidays: { readonly [key: string]: string };
}