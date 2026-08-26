import http from 'node:http';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import type { Configuration } from '@blargbot/config';
import { BaseClient } from '@blargbot/core/BaseClient.js';
import { ModuleLoader } from '@blargbot/core/modules/index.js';
import type { Logger } from '@blargbot/logger';
import express from 'express';
import asyncRouter from 'express-promise-router';
import type $fetch from 'node-fetch';

import type { ApiWorker } from './ApiWorker.js';
import { BaseRoute } from './BaseRoute.js';
import type { ApiOptions } from './types.js';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);

export class Api extends BaseClient {
    public readonly worker: ApiWorker;
    public readonly app: express.Express;
    public readonly router: express.Router;
    public readonly server: http.Server;

    public constructor(
        logger: Logger,
        config: Configuration,
        fetch: typeof $fetch,
        options: ApiOptions
    ) {
        super({
            logger,
            config,
            fetch,
            discordConfig: {
                restMode: true,
                intents: []
            }
        });

        this.worker = options.worker;
        this.router = asyncRouter();
        this.app = express();
        this.app.use(express.json());
        this.app.use((req, resp, next) => {
            const requestStr = `${req.method} ${req.url}`;
            const start = performance.now();
            resp.once('finish', () => this.logger.website(`[${resp.statusCode} ${resp.statusMessage}][${Math.round(performance.now() - start)}ms]`, requestStr));
            next();
        });

        this.app.use(this.router);
        this.server = http.createServer(this.app);
    }

    public async start(): Promise<void> {
        const routes = new ModuleLoader<Pick<BaseRoute<['/']>, 'install'>>(`${thisDir}/routes`, BaseRoute, [this], this.logger);
        routes.on('link', module => module.install(this));
        await routes.init();

        await super.start();

        await new Promise<void>(res => this.server.listen(this.config.api.port, this.config.api.host, undefined, res));
    }

    public async stop(): Promise<void> {
        await new Promise<Error | undefined>(res => this.server.close(res));
    }
}
