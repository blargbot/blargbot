import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from 'express';

import createRestProxy from './createRestProxy.js';
import type { RestProxyOptions } from './RestProxyOptions.js';

const requestLimit = 50 << 20; // 50MB

@Application.hostIfEntrypoint({
    url: env.restProxyUrl,
    secret: env.restProxySecret,
    token: env.discordToken,
    port: env.appPort
})
export default class RestProxyApplication extends Application {
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: RestProxyApplicationOptions) {
        super();
        this.#port = options.port;
        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json({ limit: requestLimit }))
            .all('/*', createRestProxy(options));
        this.#server = new Server(this.#app.bind(this.#app));
    }

    protected async start(): Promise<void> {
        await new Promise<void>(res => this.#server.listen(this.#port, res));
    }

    protected async stop(): Promise<void> {
        await new Promise<void>((res, rej) => this.#server.close(err => err === undefined ? res() : rej()));
    }
}

export interface RestProxyApplicationOptions extends RestProxyOptions {
    readonly port: number;
}
