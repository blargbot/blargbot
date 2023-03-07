import type { ImageOptionsMap } from '@blargbot/image-types';
import type { ConsumeMessage, MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';

export class ImageMessageBroker {
    static readonly #imageRequest = 'image-generate';

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertExchange(ImageMessageBroker.#imageRequest, 'topic'));
    }

    public async handleImageRequest(handler: <P extends keyof ImageOptionsMap>(type: P, message: ImageOptionsMap[P], msg: ConsumeMessage) => Awaitable<Blob>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: ImageMessageBroker.#imageRequest,
            queue: ImageMessageBroker.#imageRequest,
            filter: '*',
            async handle(data, msg) {
                return await handler(msg.fields.routingKey as keyof ImageOptionsMap, await blobToJson(data), msg);
            }
        });
    }
}
