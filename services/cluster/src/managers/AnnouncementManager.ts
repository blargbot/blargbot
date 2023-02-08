import { isGuildChannel, isTextableChannel, isThreadChannel } from '@blargbot/discord-util';
import type { GuildStore } from '@blargbot/domain/stores/index.js';
import type * as Eris from 'eris';

import type { ClusterUtilities } from '../ClusterUtilities.js';
import type { Command } from '../command/index.js';
import templates from '../text.js';
import type { ICommandManager, Result } from '../types.js';

export class AnnouncementManager {
    readonly #database: GuildStore;
    readonly #util: ClusterUtilities;
    readonly #commands: ICommandManager;

    public constructor(database: GuildStore, util: ClusterUtilities, commands: ICommandManager<Command>) {
        this.#database = database;
        this.#util = util;
        this.#commands = commands;
    }

    public async clearConfig(guild: Eris.Guild): Promise<void> {
        await this.#database.setAnnouncements(guild.id, undefined);
    }

    public async getCurrentConfig(guild: Eris.Guild): Promise<Partial<AnnouncementConfigOptions>> {
        const config = await this.#database.getAnnouncements(guild.id);
        if (config === undefined)
            return {};

        let channel = await this.#util.getChannel(config.channel);
        const role = await this.#util.getRole(guild.id, config.role);

        if (channel === undefined || !isGuildChannel(channel) || !isTextableChannel(channel) || isThreadChannel(channel) && channel.threadMetadata.archived)
            channel = undefined;

        return { channel, role };
    }

    public async loadConfig(guild: Eris.Guild, user: Eris.User, queryChannel: Eris.KnownTextableChannel, options?: Partial<AnnouncementConfigOptions>): Promise<AnnounceResult> {
        const command = await this.#commands.get('announce', guild, user);
        if (command.state !== 'ALLOWED')
            return { state: 'NotAllowed' };

        let { channel, role } = options ?? await this.getCurrentConfig(guild);
        if (channel === undefined) {
            const result = await this.#util.queryChannel({
                actors: [user],
                context: queryChannel,
                choices: guild.channels.filter(isTextableChannel).values(),
                prompt: templates.announcements.prompt.channel
            });

            if (result.state === 'TIMED_OUT' || result.state === 'CANCELLED')
                return { state: 'TimedOut' };

            if (result.state === 'SUCCESS')
                channel = result.value;
        }

        if (channel === undefined)
            return { state: 'ChannelNotFound' };
        if (!isGuildChannel(channel) || channel.guild !== guild)
            return { state: 'ChannelNotInGuild' };
        if (!isTextableChannel(channel))
            return { state: 'ChannelInvalid' };

        if (role === undefined) {
            const result = await this.#util.queryRole({
                actors: [user],
                context: queryChannel,
                prompt: templates.announcements.prompt.role,
                guild: guild
            });

            if (result.state === 'TIMED_OUT' || result.state === 'CANCELLED')
                return { state: 'TimedOut' };

            if (result.state === 'SUCCESS')
                role = result.value;
        }
        if (role === undefined)
            return { state: 'RoleNotFound' };

        await this.#database.setAnnouncements(guild.id, {
            channel: channel.id,
            role: role.id
        });
        return { state: 'Success', detail: { channel, role } };
    }
}

interface AnnouncementConfig {
    readonly channel: Eris.KnownGuildTextableChannel;
    readonly role: Eris.Role;
}

interface AnnouncementConfigOptions {
    readonly channel?: Eris.KnownChannel;
    readonly role?: Eris.Role;
}

type AnnounceResult =
    | Result<'Success', AnnouncementConfig>
    | Result<'NotAllowed'>
    | Result<'ChannelNotFound'>
    | Result<'ChannelNotInGuild'>
    | Result<'ChannelInvalid'>
    | Result<'RoleNotFound'>
    | Result<'TimedOut'>
