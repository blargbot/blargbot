import type discord from 'discord-api-types/v10';
import { GatewayDispatchEvents, GatewayOpcodes } from 'discord-api-types/v10';
import { performance } from 'perf_hooks';
import WebSocket from 'ws';

import { Ratelimit } from '../ratelimit';
import { sleep } from '../util';
import { DiscordGatewayBase, DiscordGatewayEventsBase } from './DiscordGatewayBase';
import { DiscordGatewayDisconnectError } from './DiscordGatewayDisconnectError';

type DiscordGatewayEventsHelper =
    & { [P in discord.GatewayReceivePayload['op']]: [packet: Extract<discord.GatewayReceivePayload, { op: P; }>] }
    & { [P in discord.GatewayDispatchPayload['t']]: [event: Extract<discord.GatewayDispatchPayload, { t: P; }>] }

export interface DiscordGatewayEvents extends DiscordGatewayEventsHelper, DiscordGatewayEventsBase {
    'error': [error: unknown];
    'connected': [];
    'send': [packet: discord.GatewaySendPayload];
    'packet': [packet: discord.GatewayReceivePayload];
    'dispatch': [event: discord.GatewayDispatchPayload];
}

export type DiscordGatewayEvent = keyof DiscordGatewayEvents;

export class DiscordGatewayConnection extends DiscordGatewayBase<DiscordGatewayEvents> {
    #sequenceNumber: number | null = null;
    #sessionId: string | null = null;
    #resumeUrl: string | null = null;
    #lastHeartbeatAcknowledged = true;
    #lastHeartbeatSent?: number;
    #heartbeatInterval?: NodeJS.Timer;
    #heartbeatPeriod?: number;
    readonly #socket: IWebSocket;
    readonly #identify: Omit<discord.GatewayIdentifyData, 'properties' | 'compress'>;
    readonly #connectTimeout: NodeJS.Timeout;
    readonly #encoding: DiscordGatewayEncodingOptions;
    readonly #compression: DiscordGatewayCompressionOptions;
    readonly #ratelimit = new Ratelimit(120, 5, 60000);
    readonly #presenceLimit = new Ratelimit(5, 0, 20000);
    readonly #startup: Promise<void>;
    readonly #abort: AbortController;
    readonly #signal: AbortSignal;

    public get state(): DiscordGatewayState | undefined {
        if (this.#sessionId === null || this.#sequenceNumber === null || this.#resumeUrl === null)
            return undefined;

        return {
            sequenceNumber: this.#sequenceNumber,
            sessionId: this.#sessionId,
            resumeUrl: this.#resumeUrl
        };
    }

    public get ready(): Promise<void> {
        return this.#startup;
    }

    public constructor(options: DiscordGatewayOptions) {
        const abort = new AbortController();
        super(abort.signal);

        this.#abort = abort;
        this.#signal = this.#abort.signal;
        this.#identify = options.identify;
        this.#compression = options.compression ?? {
            type: '',
            decompress: data => data
        };
        this.#encoding = options.encoding ?? {
            type: 'json',
            deserialize: buffer => JSON.parse(buffer.toString('utf-8')),
            serialize: value => Buffer.from(JSON.stringify(value))
        };

        let socketUrl;
        if (options.state !== undefined) {
            socketUrl = this.#resumeUrl = options.state.resumeUrl;
            this.#startup = this.#resumeExistingSession(
                this.#sequenceNumber = options.state.sequenceNumber,
                this.#sessionId = options.state.sessionId
            );
        } else {
            const query = Object.entries({
                v: '10',
                encoding: this.#encoding.type,
                compression: this.#compression.type
            }).filter(x => x[1].length > 0)
                .map(x => `${x[0]}=${encodeURIComponent(x[1])}`)
                .join('&');
            socketUrl = `${options.socketUrl}${query.length === 0 ? '' : '?' + query}`;
            this.#startup = this.#startNewSession();
        }

        this.#socket = options.socketFactory === undefined
            ? new WebSocket(socketUrl)
            : options.socketFactory(socketUrl);

        this.#socket.on('open', () => this.#handleOpen());
        this.#socket.on('message', data => this.#handleMessage(data));
        this.#socket.on('error', error => this.emit('error', error));
        this.#socket.on('close', code => this.#handleClose(code));
        this.#connectTimeout = setTimeout(() => {
            this.#socket.close(4902);
        }, options.connectTimeout ?? 10000);

        this.once(GatewayOpcodes.Hello, hello => this.#handleHello(hello));
        this.on(GatewayOpcodes.Heartbeat, () => this.#handleHeartbeatRequested());
        this.on(GatewayOpcodes.Reconnect, () => this.disconnect(true));
        this.on(GatewayOpcodes.InvalidSession, () => this.#reidentify());
        this.once(GatewayDispatchEvents.Ready, ready => this.#handleReady(ready));
        this.once('disconnected', err => {
            if (!err.reconnectable) {
                this.#resumeUrl = null;
                this.#sequenceNumber = null;
                this.#sessionId = null;
            }
        });
    }

    public async send(packet: discord.GatewaySendPayload): Promise<void> {
        await this.#send(packet);
    }

    public disconnect(willReconnect = false): void {
        if (willReconnect)
            this.#socket.close(4901, 'Blargbot: reconnecting');
        else
            this.#socket.close(1000, 'Blargbot: disconnect');
    }

    async #resumeExistingSession(sequenceNumber: number, sessionId: string): Promise<void> {
        await this.waitFor('connected');
        await this.waitFor(GatewayOpcodes.Hello);
        await this.#sendResume(sequenceNumber, sessionId);
        await this.waitForAny([GatewayDispatchEvents.Resumed, GatewayDispatchEvents.Ready]);
    }

    async #startNewSession(): Promise<void> {
        await this.waitFor('connected');
        await this.waitFor(GatewayOpcodes.Hello);
        await this.#sendIdentify();
        await this.waitFor(GatewayDispatchEvents.Ready);
    }

    async #reidentify(): Promise<void> {
        await sleep(Math.random() * 4000 + 1000, this.#signal);
        await this.#sendIdentify();
        await this.waitFor(GatewayDispatchEvents.Ready);
    }

    async #send(packet: discord.GatewaySendPayload, priority = false): Promise<void> {
        const waits = [this.#ratelimit.wait(this.#signal, priority)];
        if (packet.op === GatewayOpcodes.PresenceUpdate)
            waits.push(this.#presenceLimit.wait(this.#signal));
        await Promise.all(waits);
        const buffer = this.#encoding.serialize(packet);
        this.#socket.send(buffer);
        this.emit('send', packet);
    }

    async #sendHeartbeat(): Promise<void> {
        if (!this.#lastHeartbeatAcknowledged)
            return this.#socket.close();

        const lastHeartbeat = this.#lastHeartbeatSent = performance.now();
        this.#lastHeartbeatAcknowledged = false;
        await this.#send({ op: GatewayOpcodes.Heartbeat, d: this.#sequenceNumber }, true);
        const ack = await this.waitForAny([GatewayOpcodes.HeartbeatAck, GatewayOpcodes.Heartbeat]);
        if (lastHeartbeat === this.#lastHeartbeatSent && ack.op === GatewayOpcodes.HeartbeatAck)
            this.#lastHeartbeatAcknowledged = true;
    }

    async #sendIdentify(): Promise<void> {
        await this.#send({
            op: GatewayOpcodes.Identify,
            d: {
                ...this.#identify,
                compress: this.#compression.type !== '',
                properties: {
                    browser: '@blargbot/discord',
                    device: '@blargbot/discord',
                    os: process.platform
                }
            }
        });
    }

    async #sendResume(sequenceNumber: number, sessionId: string): Promise<void> {
        await this.#send({
            op: GatewayOpcodes.Resume,
            d: {
                seq: sequenceNumber,
                session_id: sessionId,
                token: this.#identify.token
            }
        });
    }

    async #defibrillate(): Promise<void> {
        if (this.#heartbeatInterval !== undefined) {
            clearInterval(this.#heartbeatInterval);
            this.#heartbeatInterval = undefined;
        }

        if (this.#heartbeatPeriod !== undefined) {
            this.#heartbeatInterval = setInterval(() => void this.#sendHeartbeat().catch(err => this.emit('error', err)), this.#heartbeatPeriod);
            await this.#sendHeartbeat();
        }
    }

    async #handleHeartbeatRequested(): Promise<void> {
        if (!this.#lastHeartbeatAcknowledged)
            this.#socket.close();

        await this.#defibrillate();
    }

    #handleOpen(): void {
        this.emit('connected');
    }

    #handleClose(code?: number): void {
        this.emit('disconnected', new DiscordGatewayDisconnectError(code));
        if (this.#heartbeatInterval !== undefined)
            clearInterval(this.#heartbeatInterval);
        clearTimeout(this.#connectTimeout);
        this.#abort.abort(new Error('Gateway disconnected'));
    }

    #handleMessage(data: WebSocket.RawData): void {
        const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : Array.isArray(data) ? Buffer.concat(data) : data;
        try {
            const decompressed = this.#compression.decompress(buffer);
            const packet = this.#encoding.deserialize(decompressed) as discord.GatewayReceivePayload;
            if (packet.s !== null)
                this.#sequenceNumber = packet.s;
            this.emit('packet', packet);
            this.emit(packet.op, packet as never);
            if (packet.op === GatewayOpcodes.Dispatch) {
                this.emit('dispatch', packet);
                this.emit(packet.t, packet as never);
            }
        } catch (err: unknown) {
            this.emit('error', err);
            this.#socket.close(1003);
        }
    }

    async #handleHello(packet: discord.GatewayHello): Promise<void> {
        clearTimeout(this.#connectTimeout);
        this.#heartbeatPeriod = packet.d.heartbeat_interval;
        try {
            await sleep(Math.random() * packet.d.heartbeat_interval, this.#signal);
        } catch (err: unknown) {
            return;
        }
        await this.#defibrillate();
    }

    #handleReady(packet: discord.GatewayReadyDispatch): void {
        this.#resumeUrl = packet.d.resume_gateway_url;
        this.#sessionId = packet.d.session_id;
    }
}

export interface IWebSocket {
    on: WebSocket['on'];
    off: WebSocket['off'];
    once: WebSocket['once'];
    close: WebSocket['close'];
    send: WebSocket['send'];
}

export interface DiscordGatewayOptions {
    readonly socketUrl: string;
    readonly identify: Omit<discord.GatewayIdentifyData, 'properties' | 'compress'>;
    readonly state?: DiscordGatewayState;
    readonly socketFactory?: (url: string) => IWebSocket;
    readonly connectTimeout?: number;
    readonly encoding?: DiscordGatewayEncodingOptions;
    readonly compression?: DiscordGatewayCompressionOptions;
}

export interface DiscordGatewayEncodingOptions {
    readonly type: string;
    readonly serialize: (value: unknown) => Buffer;
    readonly deserialize: (value: Buffer) => unknown;
}

export interface DiscordGatewayCompressionOptions {
    readonly type: string;
    readonly decompress: (data: Buffer) => Buffer;
}

export interface DiscordGatewayState {
    readonly sequenceNumber: number;
    readonly sessionId: string;
    readonly resumeUrl: string;
}
