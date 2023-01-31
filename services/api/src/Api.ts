import type { Server } from 'node:http';
import { createServer } from 'node:http';
import { performance } from 'node:perf_hooks';

import type { Configuration } from '@blargbot/config';
import { BaseClient } from '@blargbot/core/BaseClient.js';
import type { Logger } from '@blargbot/logger';
import { ModuleLoader } from '@blargbot/modules';
import type { Express } from 'express';
import express from 'express';

import type { ApiWorker } from './ApiWorker.js';
import { BaseRoute } from './BaseRoute.js';
import type { ApiOptions } from './types.js';

export class Api extends BaseClient {
    public readonly worker: ApiWorker;
    public readonly app: Express;
    public readonly server: Server;

    public constructor(
        logger: Logger,
        config: Configuration,
        options: ApiOptions
    ) {
        super({
            logger,
            config,
            discordConfig: {
                restMode: true,
                intents: []
            }
        });

        this.worker = options.worker;
        this.app = express();
        this.app.use(express.json());
        this.app.use((req, resp, next) => {
            const requestStr = `${req.method} ${req.url}`;
            const start = performance.now();
            resp.once('finish', () => this.logger.website(`[${resp.statusCode} ${resp.statusMessage}][${Math.round(performance.now() - start)}ms]`, requestStr));
            next();
        });

        this.server = createServer(this.app);
    }

    public async start(): Promise<void> {
        const routes = new ModuleLoader<BaseRoute>(import.meta, 'routes', BaseRoute, [this], this.logger);
        routes.on('link', module => module.install(this));
        await routes.init();

        await super.start();

        await new Promise<void>(res => this.server.listen(this.config.api.port, this.config.api.host, undefined, res));
    }

    public async stop(): Promise<void> {
        await new Promise<Error | undefined>(res => this.server.close(res));
    }
}