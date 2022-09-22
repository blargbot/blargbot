import { GatewayDispatchEvents, GatewaySendPayload } from 'discord-api-types/v10';

import { createDeferred, Deferred, sleep } from '../util';
import { DiscordGatewayBase } from './DiscordGatewayBase';
import { DiscordGatewayConnection, DiscordGatewayEvents, DiscordGatewayOptions, DiscordGatewayState } from './DiscordGatewayConnection';
import { DiscordGatewayDisconnectError } from './DiscordGatewayDisconnectError';

export interface DiscordGatewayShardEvents extends DiscordGatewayEvents {
    'online': [];
}

export type DiscordGatewayShardStatus = 'offline' | 'online' | 'loading'

export class DiscordGatewayShard extends DiscordGatewayBase<DiscordGatewayShardEvents> {
    readonly #options: DiscordGatewayOptions;
    readonly #reconnect: Required<Exclude<DiscordGatewayShardOptions['reconnect'], undefined>>;

    #connectAttempts = 0;
    #state: undefined | DiscordGatewayState;
    #connectRequested: Deferred<void>;
    #connectionOnline: Deferred<DiscordGatewayConnection>;
    #connection?: DiscordGatewayConnection;

    public get state(): DiscordGatewayShardStatus {
        if (this.#connection !== undefined) {
            if (this.#connectAttempts > 0)
                return 'loading';
            return 'online';
        }
        if (this.#connectRequested.state === 'pending')
            return 'offline';
        return 'loading';
    }

    public constructor(options: DiscordGatewayShardOptions) {
        const abort = new AbortController();
        super(abort.signal);

        const { state, reconnect, ...rest } = options;
        this.#state = state;
        this.#options = rest;
        this.#connectRequested = createDeferred();
        this.#connectionOnline = createDeferred();
        this.#reconnect = {
            delay: attempt => Math.min(attempt * (Math.random() * 2000 + 1000), 30000),
            maxAttempts: reconnect?.maxAttempts ?? 5,
            condition: () => true
        };
        void this.#reincarnaton();
    }

    public connect(): void {
        this.#connectRequested.resolve();
    }

    public disconnect(): void {
        this.#dontAutoReconnect();
        this.#connection?.disconnect();
    }

    public reconnect(): void {
        this.#connection?.disconnect(true);
    }

    public async send(packet: GatewaySendPayload, abort?: AbortSignal): Promise<void> {
        const connection = await this.#connectionOnline.wait(abort);
        await connection.send(packet);
    }

    #dontAutoReconnect(): void {
        if (this.#connectRequested.state !== 'pending')
            this.#connectRequested = createDeferred();
        this.#connectAttempts = 0;
    }

    async #reincarnaton(): Promise<never> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                await this.#lifecycle();
            } catch (err: unknown) {
                this.#dontAutoReconnect();
                this.emit('error', err);
            }
        }
    }

    async #lifecycle(): Promise<void> {
        await sleep(this.#reconnect.delay(this.#connectAttempts));
        await this.#connectRequested.wait();
        this.#connectAttempts++;
        this.#connection = new DiscordGatewayConnection({
            ...this.#options,
            state: this.#state
        });

        this.#connection.addRelay(this);

        const disconnectPromise = this.#connection.waitFor('disconnected');
        const readyPromise = this.#connection.waitForAny([GatewayDispatchEvents.Ready, GatewayDispatchEvents.Resumed]);
        let result = await Promise.race([disconnectPromise, readyPromise]);
        if (!(result instanceof DiscordGatewayDisconnectError)) {
            this.#connectAttempts = 0;
            this.#connectionOnline.resolve(this.#connection);
            this.emit('online');
            result = await disconnectPromise;
        }

        this.#connection.removeRelay(this);

        this.#state = this.#connection.state;
        this.#connection = undefined;
        this.emit(this.state);
        this.#connectionOnline = createDeferred();

        if (!result.reconnectable || this.#connectAttempts > this.#reconnect.maxAttempts || !await this.#reconnect.condition())
            this.#dontAutoReconnect();
    }
}

export interface DiscordGatewayShardOptions extends DiscordGatewayOptions {
    readonly reconnect?: {
        readonly maxAttempts?: number;
        readonly delay?: (attempt: number) => number;
        readonly condition?: () => Promise<boolean> | boolean;
    };
}
