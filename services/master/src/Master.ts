import { ApiPool } from '@blargbot/api';
import { ClusterPool } from '@blargbot/cluster';
import { Configuration } from '@blargbot/config';
import { BaseClient } from '@blargbot/core/BaseClient';
import { ModuleLoader } from '@blargbot/core/modules';
import { BaseService } from '@blargbot/core/serviceTypes';
import { EvalResult } from '@blargbot/core/types';
import { Logger } from '@blargbot/logger';
import { MasterOptions } from '@blargbot/master/types';
import moment from 'moment-timezone';
import fetch from 'node-fetch';
import { metric } from 'prom-client';
import { inspect } from 'util';

import { ClusterStatsManager } from './managers';
import { MasterWorker } from './MasterWorker';

export class Master extends BaseClient {
    public readonly clusters: ClusterPool;
    public readonly eventHandlers: ModuleLoader<BaseService>;
    public readonly services: ModuleLoader<BaseService>;
    public readonly worker: MasterWorker;
    public readonly clusterStats: ClusterStatsManager;
    public readonly api: ApiPool;

    public readonly metrics: Record<number, metric[]>;

    public constructor(
        logger: Logger,
        config: Configuration,
        options: MasterOptions
    ) {
        super({
            logger,
            config,
            discordConfig: {
                restMode: true,
                intents: [],
                defaultImageFormat: 'png',
                defaultImageSize: 512
            }
        });

        this.worker = options.worker;
        this.api = new ApiPool(this.logger);
        this.clusterStats = new ClusterStatsManager(this.api);
        this.metrics = {};
        this.clusters = new ClusterPool(this.config.discord.shards, this.logger);
        this.eventHandlers = new ModuleLoader(`${__dirname}/events`, BaseService, [this, options], this.logger, e => e.name);
        this.services = new ModuleLoader(`${__dirname}/services`, BaseService, [this, options], this.logger, e => e.name);

        this.services.on('add', module => void module.start());
        this.services.on('remove', module => void module.stop());
        this.eventHandlers.on('add', module => void module.start());
        this.eventHandlers.on('remove', module => void module.stop());
    }

    public async start(): Promise<void> {
        await this.eventHandlers.init();

        await Promise.all([
            super.start(),
            this.#hello()
        ]);

        await this.services.init();
    }

    async #hello(): Promise<void> {
        try {
            await fetch(`https://discord.com/api/channels/${this.config.discord.channels.botlog}/messages`, {
                method: 'POST',
                headers: {
                    /* eslint-disable @typescript-eslint/naming-convention */
                    'Authorization': this.config.discord.token,
                    'Content-Type': 'application/json'
                    /* eslint-enable @typescript-eslint/naming-convention */
                },
                body: JSON.stringify({ content: `My master process just initialized on <t:${moment().unix()}>.` })
            });
        } catch (err: unknown) {
            this.logger.error('Could not post startup message', err);
        }
    }
    public async eval(author: string, text: string): Promise<EvalResult> {
        if (!this.util.isBotOwner(author))
            throw new Error(`User ${author} does not have permission to run eval`);

        try {
            const code = !text.includes('\n')
                ? `async () => ${text}`
                : `async () => { ${text} }`;
            const func = eval(code) as () => Promise<unknown>;
            return { success: true, result: await func.call(this) };
        } catch (err: unknown) {
            return { success: false, error: inspect(err) };
        }
    }
}
