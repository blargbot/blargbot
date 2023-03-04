import Application from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import { TimeoutMessageBroker } from './TimeoutMessageBroker.js';
import { TimeoutService } from './TimeoutService.js';

@Application.hostIfEntrypoint(() => [{
    cron: env.get(String, 'TIMEOUT_CRON'),
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class GuildSettingsApplication extends Application {
    readonly #messages: TimeoutMessageBroker;
    readonly #service: TimeoutService;

    public constructor(options: GuildSettingsApplicationOptions) {
        super();

        this.#messages = new TimeoutMessageBroker(options.messages);
        this.#service = new TimeoutService(options.cron, this.#messages);
    }

    protected async start(): Promise<void> {
        await this.#messages.connect();
        this.#service.start();
    }

    protected async stop(): Promise<void> {
        this.#service.stop();
        await this.#messages.disconnect();
    }
}

export interface GuildSettingsApplicationOptions {
    readonly cron: string;
    readonly messages: ConnectionOptions;
}
