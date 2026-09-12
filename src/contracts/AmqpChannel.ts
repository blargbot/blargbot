import { randomUUID } from 'node:crypto';

import { AsyncResetValue, deepClone, Registry, usingListener, waitForAbort, whenAborted } from '@blargbot/util';
import type { Channel, ChannelModel, ConfirmChannel, ConsumeMessage, ConsumeMessageFields, Options, Replies } from 'amqplib';
import amqplib from 'amqplib';

import type { AmqpMessage } from './messages/AmqpMessage.js';
import { AmqpMessageProperties } from './messages/AmqpMessageProperties.js';
import type { AmqpTable } from './messages/AmqpValue.js';
import { asBuffer, asUint8Array } from './util.js';

export interface AmqpPublishOptions extends Omit<Options.Publish, 'contentType' | 'contentEncoding'> {
    signal?: AbortSignal;
    headers?: AmqpTable;
}

export type AmqpReplyOptions = Omit<AmqpPublishOptions, 'correlationId'>

export interface AmqpRawChannel extends ConfirmChannel {
    readonly signal: AbortSignal;
}

export interface AmqpConsumeOptions extends Options.Consume {
    maxRetries?: number;
    arguments?: AmqpTable;
}

export interface AmqpAssertQueue extends Options.AssertQueue {
    arguments?: AmqpTable;
    once?: boolean;
}

export interface AmqpAssertExchange extends Options.AssertExchange {
    arguments?: AmqpTable;
    once?: boolean;
}
export interface AmqpBindOptions {
    arguments?: AmqpTable;
    once?: boolean;
}

export class AmqpConnection implements Disposable {
    readonly #url: string;
    readonly #options: Options.Connect | undefined;
    readonly #controller = new AbortController();
    readonly #onConnect = new Registry<(connection: ChannelModel, signal: AbortSignal) => Promise<void>>();
    readonly #onError = new Registry<(error: unknown) => void>();
    #connection?: ChannelModel;

    public constructor(url: string, options?: Options.Connect) {
        this.#url = url;
        this.#options = options;

        void this.#connect();
    }

    public onError(handler: (error: unknown) => void): Disposable {
        return this.#onError.register(handler);
    }

    public onConnected(handler: (lifetime: AbortSignal) => void): Disposable {
        return this.#onConnect.register((_, signal) => {
            try {
                handler(signal);
                return Promise.resolve();
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(err);
            }
        });
    }

    async #connect(): Promise<void> {
        while (!this.#controller.signal.aborted) {
            let connection;
            try {
                connection = await amqplib.connect(this.#url, this.#options);
            } catch (error) {
                this.#emitError(error);
                break;
            }
            connection.addListener('handler-error', (err: unknown) => this.#emitError(err));
            this.#connection = connection;
            try {
                const lifetime = new AbortController();
                connection.addListener('close', () => lifetime.abort(new Error('Internal connection has closed.')));
                for (const item of this.#onConnect)
                    await item(connection, lifetime.signal).catch(err => this.#emitError(err));
                await waitForAbort(lifetime.signal);
                this.#connection = undefined;
            } catch (error) {
                this.#emitError(error);
            } finally {
                this.#connection = undefined;
                await connection.close().catch(() => { });
            }
        }
    }

    public createChannel(): AmqpChannel {
        this.#controller.signal.throwIfAborted();
        const channel = new AmqpChannel(handler => {
            const onConnect = async (connection: ChannelModel): Promise<void> => {
                handler(await connection.createConfirmChannel());
            };
            if (this.#connection !== undefined)
                onConnect(this.#connection).catch(err => this.#emitError(err));
            return this.#onConnect.register(onConnect);
        });
        whenAborted(this.#controller.signal, () => channel[Symbol.dispose]());
        return channel;
    }

    #emitError(error: unknown): void {
        if (this.#onError.isEmpty)
            throw error;

        for (const handler of this.#onError) {
            handler(error);
        }
    }

    public [Symbol.dispose](): void {
        this.#controller.abort(new Error('Connection is disposed.'));
        this.#connection?.close().catch(err => this.#emitError(err));
    }
}

export class AmqpChannel implements Disposable {
    readonly #subscription: Disposable;
    readonly #rawChannel = new AsyncResetValue<AmqpRawChannel>();
    readonly #topology: AmqpTopology = { queues: new Set(), exchanges: new Set() };
    #waitForClose?: Disposable;

    public get hasRawChannel(): boolean {
        return this.#rawChannel.hasValue;
    }

    public async getRawChannel(signal?: AbortSignal): Promise<AmqpRawChannel> {
        return await this.#rawChannel.getValue(signal);
    }

    public constructor(channelSource: (handler: (channel: ConfirmChannel) => void) => Disposable) {
        this.#subscription = channelSource(channel => {
            const closed = new AbortController();
            channel.addListener('close', () => closed.abort(new Error('The channel was closed')));
            const rawChannel = Object.assign(channel, { signal: closed.signal });
            this.#waitForClose?.[Symbol.dispose]();
            this.#waitForClose = usingListener(channel, 'close', () => this.#rawChannel.clear());
            this.#rawChannel.resolve(
                applyTopology(rawChannel, deepClone(this.#topology))
                    .then(() => rawChannel)
            );
        });
    }

    public async assertExchange(name: string, type: string, options?: AmqpAssertExchange): Promise<AmqpExchange> {
        let applied = false;
        if (this.hasRawChannel) {
            const channel = await this.#rawChannel.getValue();
            ({ exchange: name } = await channel.assertExchange(name, type, options));
            applied = true;
        } else if (name === '') {
            name = randomUUID();
        }
        return new AmqpExchange(this, this.#topology, {
            name,
            type,
            options: deepClone(options),
            bindings: new Set(),
            applied
        });
    }

    public async assertQueue(name: string, options?: AmqpAssertQueue): Promise<AmqpQueue> {
        let applied = false;
        if (this.hasRawChannel) {
            const channel = await this.#rawChannel.getValue();
            ({ queue: name } = await channel.assertQueue(name, options));
            applied = true;
        } else if (name === '') {
            name = randomUUID();
        }
        return new AmqpQueue(this, this.#topology, {
            name,
            options: deepClone(options),
            bindings: new Set(),
            consumers: new Set(),
            applied
        });
    }

    public [Symbol.dispose](): void {
        using _0 = this.#waitForClose;
        using _1 = this.#subscription;
        this.#rawChannel.reject(new Error('Channel has been closed.'));
    }
}

export class AmqpExchange implements Disposable {
    readonly #root: AmqpTopology;
    readonly #definition: AmqpExchangeDefinition;
    readonly #channel: AmqpChannel;

    public get channel(): AmqpChannel {
        return this.#channel;
    }

    public get name(): string {
        return this.#definition.name;
    }

    public constructor(channel: AmqpChannel, root: AmqpTopology, definition: AmqpExchangeDefinition) {
        this.#channel = channel;
        this.#root = root;
        this.#definition = definition;

        if (!definition.applied || definition.options?.once !== true)
            root.exchanges.add(definition);
    }

    public async send(routingKey: string, message: AmqpMessage, options?: AmqpPublishOptions): Promise<void> {
        const channel = await this.#channel.getRawChannel();
        await sendMessage(channel, (body, options, cb) => channel.publish(this.name, routingKey, body, options, cb), message, options);
    }

    public async bind(exchange: string | AmqpExchange, pattern: string, options?: AmqpBindOptions): Promise<AmqpBinding> {
        let applied = false;
        if (typeof exchange === 'object')
            exchange = exchange.name;
        if (this.#channel.hasRawChannel) {
            const channel = await this.#channel.getRawChannel();
            await channel.bindExchange(this.name, exchange, pattern, options?.arguments);
            applied = true;
        }
        return new AmqpBinding(this.#channel, this.#definition, {
            isExchange: true,
            source: exchange,
            pattern,
            options: deepClone(options),
            applied
        });
    }

    public [Symbol.dispose](): void {
        this.#root.exchanges.delete(this.#definition);
    }

    public async delete(options?: Options.DeleteExchange): Promise<void> {
        this.#root.exchanges.delete(this.#definition);
        const channel = await this.#channel.getRawChannel();
        await channel.deleteExchange(this.name, options);
    }
}

export class AmqpQueue implements Disposable {
    readonly #root: AmqpTopology;
    readonly #definition: AmqpQueueDefinition;
    readonly #channel: AmqpChannel;

    public get channel(): AmqpChannel {
        return this.#channel;
    }

    public get name(): string {
        return this.#definition.name;
    }

    public constructor(channel: AmqpChannel, root: AmqpTopology, definition: AmqpQueueDefinition) {
        this.#channel = channel;
        this.#root = root;
        this.#definition = definition;

        if (!definition.applied || definition.options?.once !== true)
            root.queues.add(definition);
    }

    public async send(message: AmqpMessage, options?: AmqpPublishOptions): Promise<void> {
        const channel = await this.#channel.getRawChannel(options?.signal);
        await sendMessage(channel, (body, options, cb) => channel.sendToQueue(this.name, body, options, cb), message, options);
    }

    public async bind(exchange: string | AmqpExchange, pattern: string, options?: AmqpBindOptions): Promise<AmqpBinding> {
        let applied = false;
        if (typeof exchange === 'object')
            exchange = exchange.name;
        if (this.#channel.hasRawChannel) {
            const channel = await this.#channel.getRawChannel();
            await channel.bindQueue(this.name, exchange, pattern, options?.arguments);
            applied = true;
        }
        return new AmqpBinding(this.#channel, this.#definition, {
            isExchange: false,
            source: exchange,
            pattern,
            options: deepClone(options),
            applied
        });
    }

    public async consume(handler: (message: AmqpConsumeMessage, signal: AbortSignal) => Awaitable<void>, options?: AmqpConsumeOptions): Promise<AmqpConsumer> {
        const noAck = options?.noAck;
        const serverCancel = new AbortController();
        const queue = this.name;
        async function onMessage(channel: AmqpRawChannel, raw: ConsumeMessage | null): Promise<void> {
            if (raw === null) {
                serverCancel.abort(new Error('AmqpConsumer was cancelled by the server.'));
                return;
            }

            const message = new AmqpConsumeMessage(channel, raw, noAck);

            try {
                await handler(message, channel.signal);
            } catch (error) {
                if (message.canAcknowledge) {
                    const maxRetries = options?.maxRetries ?? 10;
                    const retryCount = asNumberOrDefault(message.properties.headers?.['x-retry-count'], 0);
                    if (retryCount >= maxRetries) {
                        message.reject(false);
                    } else {
                        const { deliveryMode, headers, ...props } = message.properties;
                        await sendMessage(
                            channel,
                            (body, options, cb) => channel.sendToQueue(queue, body, options, cb),
                            message,
                            {
                                ...props,
                                persistent: deliveryMode === 2,
                                headers: { ...headers, 'x-retry-count': retryCount + 1 }
                            }
                        );
                        message.ack();
                    }
                }
                throw error;
            }
            if (message.canAcknowledge)
                message.ack();
        }

        let consumerTag;
        if (this.#channel.hasRawChannel) {
            const channel = await this.#channel.getRawChannel();
            ({ consumerTag } = await channel.consume(this.name, message => void handleSafe(channel, message, onMessage), options));
        } else {
            consumerTag = randomUUID();
        }
        return new AmqpConsumer(this.#channel, this.#definition, {
            id: consumerTag,
            handler: (channel, message) => void handleSafe(channel, message, onMessage),
            options: deepClone(options)
        }, serverCancel.signal);
    }

    public [Symbol.dispose](): void {
        this.#root.queues.delete(this.#definition);
    }

    public async delete(options?: Options.DeleteQueue): Promise<Replies.DeleteQueue> {
        this.#root.queues.delete(this.#definition);
        const channel = await this.#channel.getRawChannel();
        return await channel.deleteQueue(this.name, options);
    }
}

export class AmqpBinding implements Disposable {
    readonly #root: AmqpExchangeDefinition | AmqpQueueDefinition;
    readonly #definition: AmqpBindingDefinition;
    readonly #channel: AmqpChannel;

    public get channel(): AmqpChannel {
        return this.#channel;
    }

    public constructor(channel: AmqpChannel, root: AmqpExchangeDefinition | AmqpQueueDefinition, definition: AmqpBindingDefinition) {
        this.#channel = channel;
        this.#root = root;
        this.#definition = definition;

        if (!definition.applied || definition.options?.once !== true)
            root.bindings.add(definition);
    }

    public [Symbol.dispose](): void {
        this.#root.bindings.delete(this.#definition);
    }

    public async delete(): Promise<void> {
        this.#root.bindings.delete(this.#definition);
        const channel = await this.#channel.getRawChannel();
        await channel[this.#definition.isExchange ? 'unbindExchange' : 'unbindQueue'](
            this.#root.name,
            this.#definition.source,
            this.#definition.pattern,
            this.#definition.options?.arguments
        );
    }
}

export class AmqpConsumer implements AsyncDisposable {
    readonly #root: AmqpQueueDefinition;
    readonly #definition: AmqpConsumerDefinition;
    readonly #signal: AbortSignal;
    readonly #clientCancel: AbortController;
    readonly #channel: AmqpChannel;

    public get channel(): AmqpChannel {
        return this.#channel;
    }

    public get signal(): AbortSignal {
        return this.#signal;
    }

    public constructor(channel: AmqpChannel, root: AmqpQueueDefinition, definition: AmqpConsumerDefinition, serverCancel: AbortSignal) {
        this.#channel = channel;
        this.#root = root;
        this.#definition = definition;
        this.#clientCancel = new AbortController();
        this.#signal = AbortSignal.any([serverCancel, this.#clientCancel.signal]);

        root.consumers.add(definition);
        whenAborted(serverCancel, () => root.consumers.delete(definition));
    }

    public async [Symbol.asyncDispose](): Promise<void> {
        this.#root.consumers.delete(this.#definition);
        if (this.#channel.hasRawChannel) {
            const channel = await this.#channel.getRawChannel();
            await channel.cancel(this.#definition.id);
        }
        this.#clientCancel.abort(new Error('AmqpConsumer was disposed.'));
    }
}

export class AmqpConsumeMessage implements AmqpMessage {
    readonly #properties: AmqpMessageProperties;
    readonly #channel: ConfirmChannel;
    readonly #content: Uint8Array;
    readonly #raw: ConsumeMessage;
    readonly #fields: Readonly<ConsumeMessageFields>;
    #canAcknowledge: boolean;

    public get properties(): AmqpMessageProperties {
        return this.#properties;
    }

    public get content(): Uint8Array {
        return this.#content;
    }

    public get fields(): Readonly<ConsumeMessageFields> {
        return this.#fields;
    }

    public get canAcknowledge(): boolean {
        return this.#canAcknowledge;
    }

    public constructor(channel: ConfirmChannel, raw: ConsumeMessage, noAck?: boolean) {
        this.#channel = channel;
        this.#raw = raw;
        this.#content = asUint8Array(raw.content);
        this.#fields = Object.freeze(deepClone(raw.fields));
        this.#properties = Object.freeze(AmqpMessageProperties.decode(raw.properties));
        Object.freeze(this.#properties.headers);
        this.#canAcknowledge = noAck !== true;
    }

    public async reply(message: AmqpMessage, options?: AmqpReplyOptions): Promise<void> {
        const queue = this.#properties.replyTo;
        if (queue === undefined)
            throw new Error('Cannot reply as no replyTo address is set.');

        await sendMessage(
            this.#channel,
            (body, options, cb) => this.#channel.sendToQueue(queue, body, options, cb),
            message,
            {
                ...options,
                correlationId: this.#properties.correlationId
            }
        );
    }

    public ack(): void {
        if (!this.#canAcknowledge)
            return;
        this.#canAcknowledge = false;
        this.#channel.ack(this.#raw);
    }

    public nack(requeue?: boolean): void {
        if (!this.#canAcknowledge)
            return;

        this.#canAcknowledge = false;
        this.#channel.nack(this.#raw, undefined, requeue);
    }

    public reject(requeue?: boolean): void {
        if (!this.#canAcknowledge)
            return;

        this.#canAcknowledge = false;
        this.#channel.reject(this.#raw, requeue);
    }
}

interface AmqpTopology {
    readonly queues: Set<AmqpQueueDefinition>;
    readonly exchanges: Set<AmqpExchangeDefinition>;
}

interface AmqpQueueDefinition {
    readonly name: string;
    readonly options: AmqpAssertQueue | undefined;
    readonly bindings: Set<AmqpBindingDefinition>;
    readonly consumers: Set<AmqpConsumerDefinition>;
    applied: boolean;
}

interface AmqpExchangeDefinition {
    readonly name: string;
    readonly type: string;
    readonly options: AmqpAssertExchange | undefined;
    readonly bindings: Set<AmqpBindingDefinition>;
    applied: boolean;
}

interface AmqpBindingDefinition {
    readonly source: string;
    readonly isExchange: boolean;
    readonly pattern: string;
    readonly options: AmqpBindOptions | undefined;
    applied: boolean;
}

interface AmqpConsumerDefinition {
    readonly id: string;
    readonly handler: (this: unknown, channel: AmqpRawChannel, message: ConsumeMessage | null) => void;
    readonly options: AmqpConsumeOptions | undefined;
}

async function applyTopology(channel: AmqpRawChannel, topology: AmqpTopology): Promise<void> {
    await Promise.all([
        ...assertIfNotApplied(topology.exchanges, x => channel.assertExchange(x.name, x.type, x.options)),
        ...assertIfNotApplied(topology.queues, q => channel.assertQueue(q.name, q.options))
    ]);
    await Promise.all([
        ...bindIfNotApplied(topology.exchanges, (x, b) => channel.bindExchange(x.name, b.source, b.pattern, b.options?.arguments)),
        ...bindIfNotApplied(topology.queues, (x, b) => channel.bindQueue(x.name, b.source, b.pattern, b.options?.arguments)),
        ...topology.queues.values()
            .flatMap(q => q.consumers.values().map(c => ({ q, c })))
            .map(({ q, c }) => channel.consume(q.name, c.handler.bind(null, channel), { ...c.options, consumerTag: c.id }))
    ]);
}
function assertIfNotApplied<
    Source extends { applied: boolean; readonly options?: { readonly once?: boolean; }; }
>(
    source: Iterable<Source>,
    assert: (value: Source) => Awaitable<unknown>
): Iterable<Promise<void>> {
    return Iterator.from(source)
        .filter(x => !x.applied || x.options?.once !== true)
        .map(async x => {
            await assert(x);
            x.applied = true;
        });
}
function bindIfNotApplied<
    const Source extends { bindings: Iterable<{ applied: boolean; readonly options?: { readonly once?: boolean; }; }>; },
>(
    source: Iterable<Source>,
    bind: (outer: Source, inner: ElementType<Source['bindings']>) => Awaitable<unknown>
): Iterable<Promise<void>> {
    return Iterator.from(source)
        .flatMap(o => Iterator.from(o.bindings as Iterable<ElementType<Source['bindings']>>).map(i => ({ o, i })))
        .filter(x => !x.i.applied || x.i.options?.once !== true)
        .map(async x => {
            await bind(x.o, x.i);
            x.i.applied = true;
        });
}

type ElementType<T extends Iterable<unknown>> = T extends Iterable<infer R> ? R : never;

async function sendMessage(channel: Channel, send: (body: Buffer, options: Options.Publish, cb: (err: unknown) => void) => boolean, message: AmqpMessage, options?: AmqpPublishOptions): Promise<void> {
    const { signal, ...amqpOptions } = options ?? {};
    const content = asBuffer(message.content);
    const publishOptions: Options.Publish = {
        ...amqpOptions,
        contentEncoding: message.properties.contentEncoding,
        contentType: message.properties.contentType
    };
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const cb = (err: unknown): void => {
        if (err !== undefined && err !== null)
            reject(err);
        else
            resolve();
    };

    signal?.throwIfAborted();
    while (!send(content, publishOptions, cb)) {
        await waitForDrain(channel, signal);
        signal?.throwIfAborted();
    }

    await promise;
}

async function waitForDrain(channel: Channel, signal?: AbortSignal): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    using _closed = usingListener(channel, 'close', () => reject(new Error('Channel has closed.')));
    using _drained = usingListener(channel, 'drain', () => resolve());
    using _abort = whenAborted(signal, reject);
    await promise;
}

async function handleSafe(channel: AmqpRawChannel, message: ConsumeMessage | null, handler: (channel: AmqpRawChannel, message: ConsumeMessage | null) => Promise<void>): Promise<void> {
    try {
        await handler(channel, message);
    } catch (error) {
        if (channel.listenerCount('handler-error') > 0) {
            setImmediate(() => channel.emit('handler-error', error, 'delivery'));
        } else {
            await channel.close().catch(() => { });
            channel.emit('error', error);
        }
    }
}

function asNumberOrDefault(value: unknown, fallback: number): number {
    if (typeof value === 'number' && !isNaN(value))
        return value;

    if (typeof value !== 'string')
        return fallback;

    if (/^[+-]?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value))
        return Number(value);

    return fallback;
}
