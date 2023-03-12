import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

import type { ImageOptionsMap } from './ImageOptions.js';

const exchange = 'image-generate';
export class ImageGenerateMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'topic'));
    }

    async #handleImageRequest(name: string | undefined, types: readonly [], handler: (payload: ImageOptionsMap[keyof ImageOptionsMap], msg: ConsumeMessage) => Awaitable<Blob>): Promise<MessageHandle>
    async #handleImageRequest<P extends keyof ImageOptionsMap>(name: string | undefined, types: readonly P[], handler: (payload: ImageOptionsMap[P], msg: ConsumeMessage) => Awaitable<Blob>): Promise<MessageHandle>
    async #handleImageRequest<P extends keyof ImageOptionsMap>(name: string | undefined, types: readonly P[], handler: (payload: ImageOptionsMap[P], msg: ConsumeMessage) => Awaitable<Blob>): Promise<MessageHandle> {
        const filters = types.length === 0 ? ['*'] : [...types];
        return await this.#messages.handleMessage({
            exchange: exchange,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, name),
            filter: filters,
            async handle(data, msg) {
                return await handler(await blobToJson(data), msg);
            }
        });
    }

    public async handleImageRequest(handler: <P extends keyof ImageOptionsMap>(type: P, payload: ImageOptionsMap[P], msg: ConsumeMessage) => Awaitable<Blob>): Promise<MessageHandle> {
        return await this.#handleImageRequest('ALL', [], (...args) => handler(args[1].fields.routingKey as keyof ImageOptionsMap, ...args));
    }

    public async requestImage<P extends keyof ImageOptionsMap>(type: P, payload: ImageOptionsMap[P]): Promise<Blob> {
        return await this.#messages.request(exchange, type, jsonToBlob(payload));
    }
}
