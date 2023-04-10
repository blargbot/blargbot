import Discord from '@blargbot/discord-types';
import type { ConsumeMessage, MessageHandle } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob, MessageHub } from '@blargbot/message-hub';

const exchange = 'discord-interaction-stream';
export class DiscordInteractionStreamMessageBroker {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(exchange, 'topic', { durable: true }));
    }

    public async pushInteraction(interaction: Discord.GatewayInteractionCreateDispatchData): Promise<void> {
        const route = `${interaction.type}.${this.#getInteractionId(interaction) ?? '-'}.${interaction.channel_id ?? '-'}.${interaction.user?.id ?? '-'}`;
        await this.#messages.publish(exchange, route, await jsonToBlob(interaction));
    }

    public async handleInteraction<T extends keyof InteractionTypeMap>(type: T, handler: (interaction: InteractionTypeMap[T], message: ConsumeMessage) => Awaitable<void>, options?: HandleInteractionOptions): Promise<MessageHandle>
    public async handleInteraction<T extends keyof InteractionTypeMap>(type: Iterable<T>, handler: (interaction: InteractionTypeMap[T], message: ConsumeMessage) => Awaitable<void>, options?: HandleInteractionOptions): Promise<MessageHandle>
    public async handleInteraction<T extends keyof InteractionTypeMap>(type: T | Iterable<T>, handler: (interaction: InteractionTypeMap[T], message: ConsumeMessage) => Awaitable<void>, options?: HandleInteractionOptions): Promise<MessageHandle> {
        const types = typeof type === 'string' ? [type] : [...type];
        const { id, userId, channelId } = options ?? {};
        const ids = toNonEmptyArray(id, '*');
        const userIds = toNonEmptyArray(userId, '*');
        const channelIds = toNonEmptyArray(channelId, '*');
        const filters = types.flatMap(type => ids.flatMap(id => userIds.flatMap(userId => channelIds.map(channelId => `${nameToInteractionTypeMap[type]}.${id}.${channelId}.${userId}`))));
        const name = options?.name ?? types.join(',');

        return await this.#messages.handleMessage({
            exchange,
            filter: filters,
            queue: MessageHub.makeQueueName(this.#serviceName, exchange, name),
            handle: async (data, msg) => {
                await handler(await blobToJson(data), msg);
            },
            queueArgs: {
                autoDelete: options?.persistent ?? types.length < filters.length
            }
        });
    }

    #getInteractionId(interaction: Discord.GatewayInteractionCreateDispatchData): string | undefined {
        switch (interaction.type) {
            case Discord.InteractionType.ApplicationCommand: return interaction.id;
            case Discord.InteractionType.ApplicationCommandAutocomplete: return interaction.id;
            case Discord.InteractionType.MessageComponent: return interaction.data.custom_id;
            case Discord.InteractionType.ModalSubmit: return interaction.data.custom_id;
            case Discord.InteractionType.Ping: return interaction.id;
            default: return interaction;
        }
    }
}

function toNonEmptyArray(values: undefined | string | bigint | Iterable<string | bigint>, fallback: string | bigint): Array<string | bigint> {
    switch (typeof values) {
        case 'string': return [values];
        case 'bigint': return [values];
        case 'undefined': return [fallback];
        default: return [...values];
    }
}

export type InteractionTypeMap = {
    [P in Discord.GatewayInteractionCreateDispatchData as InteractionTypeToNameMap[P['type']]]: P
}

const nameToInteractionTypeMap = {
    command: Discord.InteractionType.ApplicationCommand,
    autocomplete: Discord.InteractionType.ApplicationCommandAutocomplete,
    component: Discord.InteractionType.MessageComponent,
    modal: Discord.InteractionType.ModalSubmit,
    ping: Discord.InteractionType.Ping
} as const;
type InteractionTypeToNameMap = { [P in keyof typeof nameToInteractionTypeMap as typeof nameToInteractionTypeMap[P]]: P }

export interface HandleInteractionOptions {
    readonly id?: string | bigint | Iterable<string | bigint>;
    readonly channelId?: bigint | string | Iterable<string | bigint>;
    readonly userId?: bigint | string | Iterable<string | bigint>;
    readonly name: string;
    readonly persistent: boolean;
}
