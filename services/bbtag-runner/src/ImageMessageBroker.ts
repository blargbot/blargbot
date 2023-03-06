import type { Entities } from '@bbtag/blargbot';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';

export class ImageMessageBroker extends MessageBroker {
    static readonly #bbtagRequest = 'bbtag-requests';

    protected override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(ImageMessageBroker.#bbtagRequest, 'direct');
    }

    public async handleBBTagExecutionRequest(handler: (message: BBTagExecutionRequest, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: ImageMessageBroker.#bbtagRequest,
            queue: ImageMessageBroker.#bbtagRequest,
            filter: '*',
            async handle(data, msg) {
                return await handler(await this.blobToJson(data), msg);
            }
        });
    }
}

export interface BBTagExecutionRequest {
    user: Entities.User;
}
