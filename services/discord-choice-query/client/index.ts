import type { MessageHandle } from '@blargbot/message-hub';
import { ConsumeMessage, MessageHub } from '@blargbot/message-hub';
import { json } from '@blargbot/serialization';

const queryExchange = 'discord-choice-query';
const selectOptionsExchange = 'discord-choice-query-select-options';
export class DiscordChoiceQueryMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        messages.onConnected(c => Promise.all([
            c.assertExchange(queryExchange, 'fanout', { durable: true }),
            c.assertExchange(selectOptionsExchange, 'direct', { durable: true })
        ]));
    }

    public async queryChoice(request: DiscordChoiceQueryRequest): Promise<DiscordChoiceQueryResponse> {
        const response = await this.#messages.request(queryExchange, '', await discordChoiceQueryRequestSerializer.toBlob(request));
        return await discordChoiceQueryResponseSerializer.fromBlob(response);
    }

    public async createQueryChoice(request: DiscordChoiceQueryRequest, replyTo: string, requestId: string): Promise<void> {
        await this.#messages.publish(queryExchange, '', await discordChoiceQueryRequestSerializer.toBlob(request), {
            replyTo,
            headers: {
                [ConsumeMessage.requestHeader]: requestId
            }
        });
    }

    public async handleQueryRequest(handler: (request: DiscordChoiceQueryRequest, message: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: queryExchange,
            filter: '',
            queue: MessageHub.makeQueueName(this.#serviceName, queryExchange),
            handle: async (data, msg) => {
                await handler(await discordChoiceQueryRequestSerializer.fromBlob(data), msg);
            }
        });
    }

    public async sendQueryResponse(replyTo: string, requestId: string, response: DiscordChoiceQueryResponse): Promise<void> {
        await this.#messages.respond(replyTo, requestId, await discordChoiceQueryResponseSerializer.toBlob(response));
    }

    public async handleSelectOptionsRequest(type: string, handler: (request: DiscordSelectOptionsRequest, message: ConsumeMessage) => Awaitable<DiscordSelectOptionsResponse>): Promise<MessageHandle> {
        return await this.#messages.handleMessage({
            exchange: selectOptionsExchange,
            filter: type,
            queue: MessageHub.makeQueueName(this.#serviceName, selectOptionsExchange, type),
            handle: async (data, msg) => {
                const result = await handler(await discordSelectOptionsRequestSerializer.fromBlob(data), msg);
                return await discordSelectOptionsResponseSerializer.toBlob(result);
            }
        });
    }

    public async requestSelectOptions(type: string, request: DiscordSelectOptionsRequest): Promise<DiscordSelectOptionsResponse> {
        const response = await this.#messages.request(selectOptionsExchange, type, await discordSelectOptionsRequestSerializer.toBlob(request));
        return await discordSelectOptionsResponseSerializer.fromBlob(response);
    }
}

export interface DiscordSelectOptionsRequest {
    readonly channelId: bigint;
    readonly userId: bigint;
    readonly values: readonly string[];
    readonly locale: string;
    readonly page: number;
    readonly pageCount: number;
    readonly total: number;
}

export interface DiscordChoiceQueryRequest {
    readonly channelId: bigint;
    readonly userId: bigint;
    readonly query: string;
    readonly type: string;
    readonly choices: readonly string[];
    readonly timeout: Date;
    readonly locale: string;
}

export interface DiscordSelectOptionsResponse {
    readonly prompt: string;
    readonly options: DiscordSelectOption[];
}

export interface DiscordSelectOption {
    readonly label: string;
    readonly value: string;
    readonly description?: string;
    readonly emoji?: {
        readonly id?: bigint;
        readonly name?: string;
        readonly animated?: boolean;
    };
}

export type DiscordChoiceQueryResponse =
    | DiscordChoiceQueryTimedOut
    | DiscordChoiceQueryCancelled
    | DiscordChoiceQueryFailed
    | DiscordChoiceQuerySuccess

export interface DiscordChoiceQueryTimedOut {
    readonly type: 'timedOut';
}

export interface DiscordChoiceQueryCancelled {
    readonly type: 'cancelled';
}

export interface DiscordChoiceQueryFailed {
    readonly type: 'failed';
    readonly reason: string;
}

export interface DiscordChoiceQuerySuccess {
    readonly type: 'success';
    readonly result: readonly string[];
}

export const discordChoiceQueryRequestSerializer = json.object<DiscordChoiceQueryRequest>({
    channelId: json.bigint,
    query: json.string,
    type: json.string,
    userId: json.bigint,
    choices: json.array(json.string),
    timeout: json.date,
    locale: json.string
});

export const discordChoiceQueryResponseSerializer = json.choice(
    json.object<DiscordChoiceQueryTimedOut>({ type: json.literal('timedOut') }),
    json.object<DiscordChoiceQueryCancelled>({ type: json.literal('cancelled') }),
    json.object<DiscordChoiceQueryFailed>({ type: json.literal('failed'), reason: json.string }),
    json.object<DiscordChoiceQuerySuccess>({ type: json.literal('success'), result: json.array(json.string) })
);

export const discordSelectOptionsRequestSerializer = json.object<DiscordSelectOptionsRequest>({
    channelId: json.bigint,
    userId: json.bigint,
    values: json.array(json.string),
    locale: json.string,
    page: json.number,
    pageCount: json.number,
    total: json.number
});

export const discordSelectOptionsResponseSerializer = json.object<DiscordSelectOptionsResponse>({
    prompt: json.string,
    options: json.array(json.object<DiscordSelectOption>({
        description: json.string.optional,
        label: json.string,
        value: json.string,
        emoji: json.object({
            id: json.bigint.optional,
            name: json.string.optional,
            animated: json.boolean.optional
        }).optional
    }))
});
