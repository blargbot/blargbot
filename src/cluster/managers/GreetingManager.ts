import type { ExecutionResult } from '@blargbot/bbtag';
import { limits } from '@blargbot/bbtag';
import type { Cluster } from '@blargbot/cluster';
import { guard, snowflake } from '@blargbot/core';
import type { GuildTriggerTag } from '@blargbot/domain';
import type eris from 'eris';

export class GreetingManager {
    public constructor(protected readonly cluster: Cluster) {
    }

    public async greet(member: eris.Member): Promise<ExecutionResult | 'CODE_MISSING' | 'CHANNEL_MISSING'> {
        const greeting = await this.cluster.database.guilds.getGreeting(member.guild.id);
        if (greeting === undefined)
            return 'CODE_MISSING';

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'greetchan');
        const channel = this.#findChannel(member.guild, channelId);
        if (channel === undefined)
            return 'CHANNEL_MISSING';

        return await this.#execute(greeting, channel, member, 'greet');
    }

    public async farewell(member: eris.Member): Promise<ExecutionResult | 'CODE_MISSING' | 'CHANNEL_MISSING'> {
        const farewell = await this.cluster.database.guilds.getFarewell(member.guild.id);
        if (farewell === undefined)
            return 'CODE_MISSING';

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'farewellchan');
        const channel = this.#findChannel(member.guild, channelId);
        if (channel === undefined)
            return 'CHANNEL_MISSING';

        return await this.#execute(farewell, channel, member, 'farewell');
    }

    async #execute(command: GuildTriggerTag, channel: eris.KnownGuildTextableChannel, member: eris.Member, name: string): Promise<ExecutionResult> {
        return await this.cluster.bbtag.execute(command.content, {
            messageId: snowflake.create().toString(),
            channelId: channel.id,
            guildId: channel.guild.id,
            userId: member.id,
            tagName: name,
            input: '',
            flagDefinitions: [],
            silent: false,
            isCC: true,
            tagVars: false,
            limit: new limits.CustomCommandLimit(channel.guild.memberCount),
            author: command.author ?? undefined,
            authorizer: command.authorizer ?? command.author ?? channel.guild.ownerID,
            cooldown: 0,
            prefix: undefined
        });
    }

    public async getFarewellChannel(guild: string | eris.Guild): Promise<eris.KnownGuildTextableChannel | undefined> {
        if (typeof guild === 'string') {
            const _guild = await this.cluster.util.getGuild(guild);
            if (_guild === undefined)
                return undefined;
            guild = _guild;
        }
        const channelId = await this.cluster.database.guilds.getSetting(guild.id, 'farewellchan');
        return this.#findChannel(guild, channelId);
    }

    public async getGreetingChannel(guild: string | eris.Guild): Promise<eris.KnownGuildTextableChannel | undefined> {
        if (typeof guild === 'string') {
            const _guild = await this.cluster.util.getGuild(guild);
            if (_guild === undefined)
                return undefined;
            guild = _guild;
        }
        const channelId = await this.cluster.database.guilds.getSetting(guild.id, 'greetchan');
        return this.#findChannel(guild, channelId);
    }

    #findChannel(guild: eris.Guild, channelId: string | undefined): eris.KnownGuildTextableChannel | undefined {
        if (channelId !== undefined) {
            const channel = guild.channels.get(channelId);
            if (channel !== undefined && guard.isTextableChannel(channel))
                return channel;
        }

        return guild.channels.find(guard.isTextableChannel);
    }
}
