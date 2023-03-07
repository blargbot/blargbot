import type { Entities } from '@bbtag/blargbot';
import type { ConsumeMessage, MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';

export class ImageMessageBroker {
    static readonly #bbtagRequest = 'bbtag-requests';
    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;
        this.#messages.onConnected(c => c.assertExchange(ImageMessageBroker.#bbtagRequest, 'direct'));
    }

    public async handleBBTagExecutionRequest(handler: (message: BBTagExecutionRequest, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: ImageMessageBroker.#bbtagRequest,
            queue: ImageMessageBroker.#bbtagRequest,
            filter: '*',
            async handle(data, msg) {
                return await handler(await blobToJson(data), msg);
            }
        });
    }
}

export interface BBTagExecutionRequest {
    user: Entities.User;
}
