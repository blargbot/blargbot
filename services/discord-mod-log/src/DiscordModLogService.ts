import type { GuildSettingsHttpClient } from '@blargbot/guild-settings-client';
import type { ModLogCreatedEvent, ModLogDeletedEvent, ModLogDetails, ModLogUpdatedEvent } from '@blargbot/mod-log-client';
import type * as discordeno from 'discordeno';

import type { IDiscordModLogEntryDatabase } from './IDiscordModLogEntryDatabase.js';
import { discoverFields } from './WellKnownModLogMetadata.js';

export class DiscordModLogService {
    readonly #database: IDiscordModLogEntryDatabase;
    readonly #discord: discordeno.Bot;
    readonly #guildSettings: GuildSettingsHttpClient;
    readonly #prefix: string;
    readonly #defaultModerator: bigint;

    public constructor(
        guildSettings: GuildSettingsHttpClient,
        database: IDiscordModLogEntryDatabase,
        discord: discordeno.Bot,
        options: DiscordModLogServiceOptions
    ) {
        this.#guildSettings = guildSettings;
        this.#database = database;
        this.#discord = discord;
        this.#prefix = options.prefix;
        this.#defaultModerator = discord.id;
    }

    public async handleModLogCreated(options: ModLogCreatedEvent): Promise<void> {
        const { modLogChannel } = await this.#guildSettings.getSettings({ guildId: options.guildId });
        if (modLogChannel === null)
            return;

        const embed = await this.#createModLogEmbed(options);

        let message;
        try {
            message = await this.#discord.helpers.sendMessage(modLogChannel, { embeds: [embed] });
        } catch (err) {
            await this.#handleError(err, options.guildId, options.caseId);
            throw err;
        }
        await this.#database.set({
            caseId: options.caseId,
            channelId: modLogChannel,
            guildId: options.guildId,
            messageId: message.id
        });
    }

    public async handleModLogUpdated(options: ModLogUpdatedEvent): Promise<void> {
        const entry = await this.#database.get(options.guildId, options.caseId);
        if (entry === undefined)
            return;

        const embed = await this.#createModLogEmbed(options);
        try {
            await this.#discord.helpers.editMessage(entry.channelId, entry.messageId, { embeds: [embed] });
        } catch (err) {
            await this.#handleError(err, options.guildId, options.caseId);
            throw err;
        }
    }

    public async handleModLogDeleted(options: ModLogDeletedEvent): Promise<void> {
        const entry = await this.#database.get(options.guildId, options.caseId);
        if (entry === undefined)
            return;

        await this.#database.delete(entry.channelId, options.caseId);

        try {
            await this.#discord.helpers.deleteMessage(entry.channelId, entry.messageId);
        } catch (err) {
            await this.#handleError(err, options.guildId, options.caseId);
            throw err;
        }
    }

    async #handleError(error: unknown, guildId: bigint, caseId: number): Promise<void> {
        if (!(error instanceof Error))
            return;

        const promises = [];
        if (error.message === 'Error: Unknown Channel')
            promises.push(this.#guildSettings.updateSettings({ guildId, modLogChannel: null }));
        if (error.message === 'Error: Unknown Message')
            promises.push(this.#database.delete(guildId, caseId));

        await Promise.all(promises);
    }

    async #createModLogEmbed(options: ModLogDetails): Promise<discordeno.Embed> {
        let colour = options.metadata.colour;
        if (typeof colour !== 'number')
            colour = defaultModLogColour;

        const [moderator, ...users] = await Promise.all([
            this.#getUser(options.moderatorId === undefined || options.users.includes(options.moderatorId)
                ? this.#defaultModerator
                : options.moderatorId),
            ...options.users.map(async u => await this.#getUser(u) ?? u)
        ]);

        return {
            title: `Case ${options.caseId}`,
            color: colour,
            timestamp: options.timestamp.valueOf(),
            author: users.length !== 1 ? undefined : {
                iconUrl: this.#avatarUrl(users[0]),
                name: this.#userTag(users[0])
            },
            description: options.users.length > 1 ? users.map(u => this.#userTag(u)).join('\n') : undefined,
            fields: [
                {
                    name: 'Type',
                    value: options.type
                },
                {
                    name: 'Reason',
                    value: options.reason ?? `Responsible moderator, please do \`${this.#prefix}reason ${options.caseId}\` to set.`
                },
                ...discoverFields(options.metadata)
            ],
            footer: moderator === undefined ? undefined : {
                text: this.#userTag(moderator),
                iconUrl: this.#avatarUrl(moderator)
            }
        };
    }

    async #getUser(userId: bigint): Promise<discordeno.User | undefined> {
        try {
            return await this.#discord.helpers.getUser(userId);
        } catch {
            return undefined;
        }
    }

    #avatarUrl(user: discordeno.User | bigint): string {
        return typeof user === 'bigint'
            ? this.#discord.helpers.getAvatarURL(user, '0000')
            : this.#discord.helpers.getAvatarURL(user.id, user.discriminator);
    }

    #userTag(user: discordeno.User | bigint): string {
        return typeof user === 'bigint'
            ? `${'UNKNOWN'}#${'UNKNOWN'} (${user})`
            : `${user.username}#${user.discriminator} (${user.id})`;
    }
}

const defaultModLogColour = 0x17c484;

export interface DiscordModLogServiceOptions {
    readonly prefix: string;
}
