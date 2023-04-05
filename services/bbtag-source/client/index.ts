import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

export interface BBTagSource {
    readonly value: string;
    readonly cooldown: number;
}

const requests = 'bbtag-source-requests';
const dropped = 'bbtag-source-unknown';
export class BBTagSourceMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => Promise.all([
            c.assertExchange(requests, 'topic', { alternateExchange: dropped, durable: true }),
            c.assertExchange(dropped, 'fanout', { durable: true })
        ]));
    }

    public async requestBBTagSource(ownerId: bigint, type: string, name: string): Promise<BBTagSource | undefined> {
        const response = await this.#messages.request(requests, type, await jsonToBlob<SourceRequest>({ ownerId: ownerId.toString(), name }));
        if (response.size === 0)
            return undefined;

        return await blobToJson(response);
    }

    public async handleBBTagSourceRequest(type: string, handler: (name: string, ownerId: bigint, message: ConsumeMessage) => Awaitable<BBTagSource | undefined>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: requests,
            queue: MessageHub.makeQueueName(this.#serviceName, requests, type),
            filter: type,
            handle: async (data, msg) => {
                const { name, ownerId } = await blobToJson<SourceRequest>(data);
                const response = await handler(name, BigInt(ownerId), msg);
                return response === undefined ? emptyResponse : await jsonToBlob(response);
            }
        });
    }

    public async handleDroppedBBTagSourceRequest(handler: (type: string, name: string, ownerId: bigint, message: ConsumeMessage) => Awaitable<BBTagSource | undefined>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: dropped,
            queue: MessageHub.makeQueueName(this.#serviceName, dropped),
            filter: '#',
            handle: async (data, msg) => {
                const { name, ownerId } = await blobToJson<SourceRequest>(data);
                const response = await handler(msg.fields.routingKey, name, BigInt(ownerId), msg);
                return response === undefined ? emptyResponse : await jsonToBlob(response);
            }
        });
    }
}

interface SourceRequest {
    readonly ownerId: string;
    readonly name: string;
}

const emptyResponse = new Blob([]);
