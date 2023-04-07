import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient } from '@blargbot/api-client';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

export interface SearchOptions {
    readonly scope: string;
    readonly query: string;
    readonly types: Iterable<string>;
}

export interface SearchKey {
    readonly scope: string;
    readonly type: string;
    readonly key: string;
}

export interface SearchData extends SearchKey {
    readonly value: string;
}

export class SearchHttpClient extends defineApiClient({
    search: b => b.route<SearchOptions>(x => `${x.scope}`)
        .query(({ query, types }) => ({ query, types: [...types] }))
        .response<string[]>(200)
}) {
    public static from(options: SearchHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): SearchHttpClient {
        if (options instanceof SearchHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new SearchHttpClient(options);
    }
}

const exchange = 'image-generate';
export class SearchMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'topic'));
    }

    public async setSearchTerm(value: SearchData): Promise<void> {
        await this.#messages.publish(exchange, 'set', await jsonToBlob(value));
    }

    public async deleteSearchTerm(value: Partial<SearchKey>): Promise<void> {
        await this.#messages.publish(exchange, 'delete', await jsonToBlob(value));
    }

    public async handleSearchTermSet(handler: (data: SearchData, message: ConsumeMessage) => Promise<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, 'set'),
            filter: 'set',
            handle: async (data, message) => {
                await handler(await blobToJson(data), message);
            }
        });
    }

    public async handleSearchTermDelete(handler: (data: Partial<SearchKey>, message: ConsumeMessage) => Promise<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, 'delete'),
            filter: 'delete',
            handle: async (data, message) => {
                await handler(await blobToJson(data), message);
            }
        });
    }
}
