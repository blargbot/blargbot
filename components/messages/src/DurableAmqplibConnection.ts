import EventEmitter from 'node:events';

import type amqplib from 'amqplib';

import DurableAmqplibChannel from './DurableAmqplibChannel.js';
import DurableAmqplibConfirmChannel from './DurableAmqplibConfirmChannel.js';

export { DurableAmqplibConnection };
export default class DurableAmqplibConnection<Connection extends amqplib.Connection> extends EventEmitter implements amqplib.Connection {
    readonly #factory: () => Promise<Connection>;
    #connection?: amqplib.Connection;
    #connectionPromise?: Promise<amqplib.Connection>;
    #closed: boolean;

    public get connection(): { serverProperties: amqplib.ServerProperties; } {
        if (this.#connection === undefined)
            throw new Error('Connection is not currently open');
        return this.#connection.connection;
    }

    public constructor(factory: () => Promise<Connection>) {
        super();
        this.#factory = factory;
        this.#closed = false;
        void this.#keepAlive();
    }

    async #keepAlive(): Promise<void> {
        while (!this.#closed) {
            const connection = await this.#getConnection();
            await new Promise<void>(res => connection.once('close', res));
        }
    }

    #getConnection(): Promise<amqplib.Connection> {
        return this.#connectionPromise ??= this.#openConnection()
            .then(c => {
                this.#connection = c;
                c.on('close', () => {
                    this.#connection = undefined;
                    this.#connectionPromise = undefined;
                });
                return c;
            })
            .catch(err => {
                this.#connection = undefined;
                this.#connectionPromise = undefined;
                throw err;
            });
    }

    async #openConnection(): Promise<amqplib.Connection> {
        if (this.#closed === true)
            throw new Error('This connection has been explicitly closed and cannot be used any more.');
        const connection = await this.#factory();
        connection.on('error', (...args: unknown[]) => this.emit('error', ...args));
        connection.on('blocked', (...args: unknown[]) => this.emit('blocked', ...args));
        connection.on('unblocked', (...args: unknown[]) => this.emit('unblocked', ...args));

        return connection;
    }

    public async waitOpen(): Promise<void> {
        await this.#getConnection();
    }

    public async close(): Promise<void> {
        this.#closed = true;
        if (this.#connectionPromise === undefined)
            return;

        await (await this.#connectionPromise).close();
        this.emit('close');
    }

    public async createChannel(): Promise<amqplib.Channel> {
        const channel = new DurableAmqplibChannel(async () => {
            const connection = await this.#getConnection();
            return await connection.createChannel();
        });
        await channel.waitOpen();
        return channel;
    }

    public async createConfirmChannel(): Promise<amqplib.ConfirmChannel> {
        const channel = new DurableAmqplibConfirmChannel(async () => {
            const connection = await this.#getConnection();
            return await connection.createConfirmChannel();
        });
        await channel.waitOpen();
        return channel;
    }
}
