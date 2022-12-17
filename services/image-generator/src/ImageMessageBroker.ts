import type { ImageOptionsMap } from '@blargbot/image-types';
import type { MessageHandle } from '@blargbot/message-broker';
import MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';

export class ImageMessageBroker extends MessageBroker {
    static readonly #imageRequest = 'image-generate';

    public constructor(options: ImageMessageBrokerOptions) {
        super(options);
    }

    protected override async onceConnected(channel: amqplib.Channel): Promise<void> {
        await channel.assertExchange(ImageMessageBroker.#imageRequest, 'topic');
    }

    public async handleImageRequest(handler: <P extends keyof ImageOptionsMap>(type: P, message: ImageOptionsMap[P]) => Awaitable<Blob>): Promise<MessageHandle> {
        return await this.handleMessage({
            exchange: ImageMessageBroker.#imageRequest,
            queue: ImageMessageBroker.#imageRequest,
            queueArgs: { autoDelete: true },
            filter: '*',
            async handle(data, msg) {
                return await handler(msg.fields.routingKey as keyof ImageOptionsMap, await this.blobToJson(data));
            }
        });
    }
}

export interface ImageMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
