import type { Entities } from '@bbtag/blargbot';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

const exchange = 'bbtag-requests';
export class BBTagExecutionMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public get executeQueueName(): string {
        return MessageHub.makeQueueName(this.#serviceName, exchange);
    }

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;
        this.#messages.onConnected(c => c.assertExchange(exchange, 'direct'));
    }

    public async requestBBTagExecution(request: BBTagExecutionRequest): Promise<BBTagExecutionResponse> {
        const response = await this.#messages.request(exchange, '', await jsonToBlob(request));
        return await blobToJson(response);
    }

    public async handleBBTagExecutionRequest(handler: (message: BBTagExecutionRequest, msg: ConsumeMessage) => Awaitable<BBTagExecutionResponse>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: exchange,
            queue: this.executeQueueName,
            filter: '*',
            async handle(data, msg) {
                return await jsonToBlob(await handler(await blobToJson(data), msg));
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
