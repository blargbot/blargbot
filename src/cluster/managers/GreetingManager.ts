import { ExecutionResult } from '@blargbot/bbtag';
import { Cluster } from '@blargbot/cluster';
import { snowflake } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { GuildTriggerTag } from '@blargbot/domain/models';
import { Guild, KnownGuildTextableChannel, Member } from 'eris';
import moment from 'moment-timezone';

export class GreetingManager {
    public constructor(protected readonly cluster: Cluster) {
    }

    public async greet(member: Member): Promise<ExecutionResult | `CODE_MISSING` | `CHANNEL_MISSING`> {
        const greeting = await this.cluster.database.guilds.getGreeting(member.guild.id);
        if (greeting === undefined)
            return `CODE_MISSING`;

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, `greetchan`);
        const channel = this.#findChannel(member.guild, channelId);
        if (channel === undefined)
            return `CHANNEL_MISSING`;

        return await this.#execute(greeting, channel, member, `greet`);
    }

    public async farewell(member: Member): Promise<ExecutionResult | `CODE_MISSING` | `CHANNEL_MISSING`> {
        const farewell = await this.cluster.database.guilds.getFarewell(member.guild.id);
        if (farewell === undefined)
            return `CODE_MISSING`;

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, `farewellchan`);
        const channel = this.#findChannel(member.guild, channelId);
        if (channel === undefined)
            return `CHANNEL_MISSING`;

        return await this.#execute(farewell, channel, member, `farewell`);
    }

    async #execute(command: GuildTriggerTag, channel: KnownGuildTextableChannel, member: Member, name: string): Promise<ExecutionResult> {
        return await this.cluster.bbtag.execute(command.content, {
            authorId: command.author ?? undefined,
            inputRaw: ``,
            isCC: true,
            limit: `customCommandLimit`,
            message: {
                attachments: [],
                author: member.user,
                channel: channel,
                content: ``,
                embeds: [],
                id: snowflake.create().toString(),
                member: member,
                createdAt: moment().valueOf()
            },
            authorizerId: command.authorizer ?? undefined,
            tagVars: false,
            rootTagName: name
        });
    }

    public async getFarewellChannel(guild: string | Guild): Promise<KnownGuildTextableChannel | undefined> {
        if (typeof guild === `string`) {
            const _guild = await this.cluster.util.getGuild(guild);
            if (_guild === undefined)
                return undefined;
            guild = _guild;
        }
        const channelId = await this.cluster.database.guilds.getSetting(guild.id, `farewellchan`);
        return this.#findChannel(guild, channelId);
    }

    public async getGreetingChannel(guild: string | Guild): Promise<KnownGuildTextableChannel | undefined> {
        if (typeof guild === `string`) {
            const _guild = await this.cluster.util.getGuild(guild);
            if (_guild === undefined)
                return undefined;
            guild = _guild;
        }
        const channelId = await this.cluster.database.guilds.getSetting(guild.id, `greetchan`);
        return this.#findChannel(guild, channelId);
    }

    #findChannel(guild: Guild, channelId: string | undefined): KnownGuildTextableChannel | undefined {
        if (channelId !== undefined) {
            const channel = guild.channels.get(channelId);
            if (channel !== undefined && guard.isTextableChannel(channel))
                return channel;
        }

        return guild.channels.find(guard.isTextableChannel);
    }
}
