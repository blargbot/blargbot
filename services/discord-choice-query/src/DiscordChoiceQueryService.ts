import type { DiscordChoiceQueryMessageBroker, DiscordChoiceQueryRequest } from '@blargbot/discord-choice-query-client';
import Discord from '@blargbot/discord-types';
import * as discordeno from 'discordeno';

import type DiscordChoiceQueryDatabase from './DiscordChoiceQueryDatabase.js';
import type { QueryDetails } from './DiscordChoiceQueryDatabase.js';

const pageSize = 25;

export class DiscordChoiceQueryService {
    readonly #messages: DiscordChoiceQueryMessageBroker;
    readonly #database: DiscordChoiceQueryDatabase;
    readonly #discord: discordeno.Bot;
    readonly #customIds: LookupInteractionIds;

    public constructor(
        messages: DiscordChoiceQueryMessageBroker,
        database: DiscordChoiceQueryDatabase,
        discord: discordeno.Bot,
        options: DiscordChannelQueryServiceOptions) {
        this.#messages = messages;
        this.#database = database;
        this.#discord = discord;

        this.#customIds = options.customIds;
    }

    public async createQuery(details: DiscordChoiceQueryRequest, replyTo: string, requestId: string): Promise<void> {
        try {
            const message = await this.#discord.helpers.sendMessage(details.channelId, await this.#renderMessage(details, 0));
            await this.#database.set({
                ...details,
                messageId: message.id,
                page: 0,
                replyTo,
                requestId
            });
        } catch (err) {
            await this.#messages.sendQueryResponse(replyTo, requestId, { type: 'failed', reason: String(err) });
            throw err;
        }
    }

    public async handleInteraction(interaction: Discord.APIMessageComponentInteraction): Promise<void> {
        const action = this.#readInteraction(interaction);
        if (action === undefined)
            return;

        const query = await this.#database.get(action.channelId, action.messageId);
        if (query === undefined)
            return await this.#handleUnknownQuery(interaction);

        if (query.userId !== action.userId)
            return await this.#handleIncorrectUser(interaction);

        switch (action.type) {
            case 'cancel': return await this.#cancelQuery(action, query);
            case 'select': return await this.#resolveQuery(action, query);
            case 'page': return await this.#changePage(interaction, action, query);
        }
    }

    public async sweepTimeouts(): Promise<void> {
        const queries = await this.#database.getTimedOut();
        await Promise.all(queries.flatMap(q => [
            this.#database.delete(q.channelId, q.messageId),
            this.#messages.sendQueryResponse(q.replyTo, q.requestId, { type: 'timedOut' })
        ]));
    }

    async #cancelQuery(action: CancelLookupInteraction, query: QueryDetails): Promise<void> {
        await Promise.all([
            this.#discord.helpers.deleteMessage(action.channelId, action.messageId),
            this.#messages.sendQueryResponse(query.replyTo, query.requestId, { type: 'cancelled' })
        ]);
    }

    async #resolveQuery(action: SelectValueInteraction, query: QueryDetails): Promise<void> {
        await Promise.all([
            this.#discord.helpers.deleteMessage(action.channelId, action.messageId),
            this.#messages.sendQueryResponse(query.replyTo, query.requestId, { type: 'success', result: action.values })
        ]);
    }

    #disableAllComponents(components?: Array<Discord.APIActionRowComponent<Discord.APIMessageActionRowComponent>>): discordeno.MessageComponents | undefined {
        if (components === undefined)
            return undefined;

        return components.map(c => ({
            type: discordeno.MessageComponentTypes.ActionRow,
            components: c.components.map(c => this.#disableActionRowComponent(c)) as discordeno.ActionRow['components']
        }));
    }

    #disableActionRowComponent(component: Discord.APIMessageActionRowComponent): discordeno.ActionRow['components'][number] {
        const result = this.#discord.transformers.component(this.#discord, component as unknown as discordeno.DiscordComponent);
        result.disabled = true;
        return result as discordeno.ActionRow['components'][number];
    }

    async #changePage(interaction: Discord.APIMessageComponentInteraction, action: ChangePageInteraction, query: QueryDetails): Promise<void> {
        const lastPage = Math.floor((query.choices.length - 1) / pageSize);
        const newPage = query.page + action.offset;
        if (newPage < 0 || newPage > lastPage)
            return await this.#handleInvalidPage(interaction);

        await Promise.all([
            this.#discord.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: discordeno.InteractionResponseTypes.UpdateMessage,
                data: {
                    components: this.#disableAllComponents(interaction.message.components)
                }
            }),
            this.#database.update(query.channelId, query.messageId, { page: newPage }),
            this.#updatePage(interaction, query, newPage)
        ]);
    }

    async #updatePage(interaction: Discord.APIMessageComponentInteraction, query: QueryDetails, page: number): Promise<void> {
        try {
            await this.#discord.helpers.editOriginalInteractionResponse(interaction.token, await this.#renderMessage(query, page));
        } catch (err) {
            await Promise.all([
                Promise.reject(err),
                this.#messages.sendQueryResponse(query.replyTo, query.requestId, { type: 'failed', reason: String(err) }),
                this.#database.delete(query.channelId, query.messageId)
            ]);
        }
    }

    async #renderMessage(query: DiscordChoiceQueryRequest, page: number): Promise<discordeno.InteractionCallbackData> {
        const choices = query.choices.slice(page * pageSize, (page + 1) * pageSize);
        const lastPage = Math.floor((query.choices.length - 1) / pageSize);
        const options = await this.#messages.requestSelectOptions(query.type, {
            channelId: query.channelId,
            userId: query.userId,
            values: choices,
            locale: query.locale,
            page,
            pageCount: lastPage + 1,
            total: query.choices.length
        });

        const controls: discordeno.ActionRow['components'] = [{
            type: discordeno.MessageComponentTypes.Button,
            label: '',
            emoji: { name: '✖️' },
            style: discordeno.ButtonStyles.Danger,
            customId: this.#customIds.cancel
        }];

        if (lastPage > 0) {
            controls.unshift({
                type: discordeno.MessageComponentTypes.Button,
                label: '',
                emoji: { name: '⬅' },
                style: discordeno.ButtonStyles.Primary,
                customId: this.#customIds.prevPage,
                disabled: page === 0
            });
            controls.push({
                type: discordeno.MessageComponentTypes.Button,
                label: '',
                emoji: { name: '➡' },
                style: discordeno.ButtonStyles.Primary,
                customId: this.#customIds.nextPage,
                disabled: page === lastPage
            });
        }

        return {
            content: options.prompt,
            components: [
                {
                    type: discordeno.MessageComponentTypes.ActionRow,
                    components: [
                        {
                            type: discordeno.MessageComponentTypes.SelectMenu,
                            customId: this.#customIds.select,
                            options: options.options
                        }
                    ]
                },
                {
                    type: discordeno.MessageComponentTypes.ActionRow,
                    components: controls
                }
            ]
        };
    }

    #readInteraction(interaction: Discord.APIMessageComponentInteraction): WellKnownInteraction | undefined {
        const base = {
            channelId: BigInt(interaction.channel_id),
            userId: BigInt(interaction.user?.id ?? interaction.member?.user.id ?? '0'),
            messageId: BigInt(interaction.message.id)
        };
        switch (interaction.data.custom_id) {
            case this.#customIds.select:
                if (interaction.data.component_type !== Discord.ComponentType.StringSelect)
                    break;
                return { type: 'select', values: interaction.data.values, ...base };
            case this.#customIds.cancel: return { type: 'cancel', ...base };
            case this.#customIds.nextPage: return { type: 'page', offset: 1, ...base };
            case this.#customIds.prevPage: return { type: 'page', offset: -1, ...base };
        }
        return undefined;
    }

    async #handleUnknownQuery(interaction: Discord.APIMessageComponentInteraction): Promise<void> {
        await this.#discord.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: discordeno.InteractionResponseTypes.ChannelMessageWithSource,
            data: {
                content: 'TODO: Idk what query that was for yo',
                flags: Discord.MessageFlags.Ephemeral
            }
        });
    }

    async #handleIncorrectUser(interaction: Discord.APIMessageComponentInteraction): Promise<void> {
        await this.#discord.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: discordeno.InteractionResponseTypes.ChannelMessageWithSource,
            data: {
                content: 'TODO: Hecc off yo',
                flags: Discord.MessageFlags.Ephemeral
            }
        });
    }

    async #handleInvalidPage(interaction: Discord.APIMessageComponentInteraction): Promise<void> {
        await this.#discord.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: discordeno.InteractionResponseTypes.ChannelMessageWithSource,
            data: {
                content: 'TODO: Page dont exist yo',
                flags: Discord.MessageFlags.Ephemeral
            }
        });
    }
}

export interface DiscordChannelQueryServiceOptions {
    readonly customIds: LookupInteractionIds;
}

export interface LookupInteractionIds {
    readonly select: string;
    readonly cancel: string;
    readonly nextPage: string;
    readonly prevPage: string;
}

type WellKnownInteraction =
    | SelectValueInteraction
    | CancelLookupInteraction
    | ChangePageInteraction

interface InteractionBase {
    readonly channelId: bigint;
    readonly userId: bigint;
    readonly messageId: bigint;
}

interface SelectValueInteraction extends InteractionBase {
    readonly type: 'select';
    readonly values: readonly string[];
}

interface CancelLookupInteraction extends InteractionBase {
    readonly type: 'cancel';
}

interface ChangePageInteraction extends InteractionBase {
    readonly type: 'page';
    readonly offset: number;
}
