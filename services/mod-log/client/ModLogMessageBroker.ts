import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

import type { ModLogCreatedEvent, ModLogCreateRequest, ModLogDeletedEvent, ModLogDeleteRequest, ModLogUpdatedEvent, ModLogUpdateRequest } from './ModLogEntry.js';
import { modLogCreatedEventSerializer, modLogCreateRequestSerializer, modLogDeletedEventSerializer, modLogDeleteRequestSerializer, modLogUpdatedEventSerializer, modLogUpdateRequestSerializer } from './ModLogEntry.js';

const requests = 'mod-log-requests';
const events = 'mod-log-events';
export class ModLogMessageBroker {
    public static readonly requestsExchange = requests;
    public static readonly eventsExchange = events;

    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => Promise.all([
            c.assertExchange(requests, 'topic', { durable: true }),
            c.assertExchange(events, 'topic', { durable: true })
        ]));
    }

    public async createModlog(options: ModLogCreateRequest): Promise<void> {
        return await this.#messages.publish(requests, 'create', await jsonToBlob(options, modLogCreateRequestSerializer));
    }

    public async handleCreateModLog(handler: (modLog: ModLogCreateRequest, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: requests,
            queue: MessageHub.makeQueueName(this.#serviceName, requests, 'create'),
            filter: 'create',
            async handle(data, message) {
                await handler(await blobToJson(data, modLogCreateRequestSerializer), message);
            }
        });
    }

    public async updateModlog(options: ModLogUpdateRequest): Promise<void> {
        return await this.#messages.publish(requests, 'update', await jsonToBlob(options, modLogUpdateRequestSerializer));
    }

    public async handleUpdateModLog(handler: (modLog: ModLogUpdateRequest, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: requests,
            queue: MessageHub.makeQueueName(this.#serviceName, requests, 'update'),
            filter: 'update',
            async handle(data, message) {
                await handler(await blobToJson(data, modLogUpdateRequestSerializer), message);
            }
        });
    }

    public async deleteModLog(options: ModLogDeleteRequest): Promise<void> {
        return await this.#messages.publish(requests, 'delete', await jsonToBlob(options, modLogDeleteRequestSerializer));
    }

    public async handleDeleteModLog(handler: (modLog: ModLogDeleteRequest, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: requests,
            queue: MessageHub.makeQueueName(this.#serviceName, requests, 'delete'),
            filter: 'delete',
            async handle(data, message) {
                await handler(await blobToJson(data, modLogDeleteRequestSerializer), message);
            }
        });
    }

    public async modLogCreated(options: ModLogCreatedEvent): Promise<void> {
        return await this.#messages.publish(events, 'created', await jsonToBlob(options, modLogCreatedEventSerializer));
    }

    public async handleModLogCreated(handler: (modLog: ModLogCreatedEvent, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: events,
            queue: MessageHub.makeQueueName(this.#serviceName, events, 'created'),
            filter: 'created',
            async handle(data, message) {
                await handler(await blobToJson(data, modLogCreatedEventSerializer), message);
            }
        });
    }

    public async modLogUpdated(options: ModLogUpdatedEvent): Promise<void> {
        return await this.#messages.publish(events, 'updated', await jsonToBlob(options, modLogUpdatedEventSerializer));
    }

    public async handleModLogUpdated(handler: (modLog: ModLogUpdatedEvent, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: events,
            queue: MessageHub.makeQueueName(this.#serviceName, events, 'updated'),
            filter: 'updated',
            async handle(data, message) {
                await handler(await blobToJson(data, modLogUpdatedEventSerializer), message);
            }
        });
    }

    public async modLogDeleted(options: ModLogDeletedEvent): Promise<void> {
        return await this.#messages.publish(events, 'deleted', await jsonToBlob(options, modLogDeletedEventSerializer));
    }

    public async handleModLogDeleted(handler: (modLog: ModLogDeletedEvent, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: events,
            queue: MessageHub.makeQueueName(this.#serviceName, events, 'deleted'),
            filter: 'deleted',
            async handle(data, message) {
                await handler(await blobToJson(data, modLogDeletedEventSerializer), message);
            }
        });
    }
}
