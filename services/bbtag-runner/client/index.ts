import type { Entities } from '@bbtag/blargbot';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

const exchange = 'bbtag-requests';
export class BBTagExecutionMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;
        this.#messages.onConnected(c => c.assertExchange(exchange, 'direct'));
    }

    public async handleBBTagExecutionRequest(handler: (message: BBTagExecutionRequest, msg: ConsumeMessage) => Awaitable<BBTagExecutionResponse>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: exchange,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange),
            filter: '*',
            async handle(data, msg) {
                return jsonToBlob(await handler(await blobToJson(data), msg));
            }
        });
    }
}

export interface BBTagExecutionRequest {
    user: Entities.User;
}

export interface BBTagExecutionResponse {
    content: string;
}
