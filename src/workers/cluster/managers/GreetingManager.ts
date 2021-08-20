import { Cluster } from '@cluster';
import { limits } from '@cluster/bbtag';
import { ExecutionResult } from '@cluster/types';
import { snowflake } from '@cluster/utils';
import { GuildTriggerTag } from '@core/types';
import { guard } from '@core/utils';
import { Collection, Guild, GuildMember, GuildTextBasedChannels } from 'discord.js';
import moment from 'moment';

export class GreetingManager {
    public constructor(protected readonly cluster: Cluster) {
    }

    public async greet(member: GuildMember): Promise<ExecutionResult | 'CODE_MISSING' | 'CHANNEL_MISSING'> {
        const greeting = await this.cluster.database.guilds.getGreeting(member.guild.id);
        if (greeting === undefined)
            return 'CODE_MISSING';

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'greetChan');
        const channel = this.findChannel(member.guild, channelId);
        if (channel === undefined)
            return 'CHANNEL_MISSING';

        return await this.execute(greeting, channel, member, 'greet');
    }

    public async farewell(member: GuildMember): Promise<ExecutionResult | 'CODE_MISSING' | 'CHANNEL_MISSING'> {
        const farewell = await this.cluster.database.guilds.getFarewell(member.guild.id);
        if (farewell === undefined)
            return 'CODE_MISSING';

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'farewellchan');
        const channel = this.findChannel(member.guild, channelId);
        if (channel === undefined)
            return 'CHANNEL_MISSING';

        return await this.execute(farewell, channel, member, 'farewell');
    }

    private async execute(command: GuildTriggerTag, channel: GuildTextBasedChannels, member: GuildMember, name: string): Promise<ExecutionResult> {
        return await this.cluster.bbtag.execute(command.content, {
            author: command.author,
            inputRaw: '',
            isCC: true,
            limit: new limits.customCommandLimit(),
            message: {
                attachments: new Collection(),
                author: member.user,
                channel: channel,
                content: '',
                embeds: [],
                id: snowflake.create().toString(),
                member: member,
                createdTimestamp: moment().valueOf()
            },
            authorizer: command.authorizer,
            tagVars: false,
            rootTagName: name
        });
    }

    public async getFarewellChannel(guild: string | Guild): Promise<GuildTextBasedChannels | undefined> {
        if (typeof guild === 'string') {
            const _guild = await this.cluster.util.getGuild(guild);
            if (_guild === undefined)
                return undefined;
            guild = _guild;
        }
        const channelId = await this.cluster.database.guilds.getSetting(guild.id, 'farewellchan');
        return this.findChannel(guild, channelId);
    }

    public async getGreetingChannel(guild: string | Guild): Promise<GuildTextBasedChannels | undefined> {
        if (typeof guild === 'string') {
            const _guild = await this.cluster.util.getGuild(guild);
            if (_guild === undefined)
                return undefined;
            guild = _guild;
        }
        const channelId = await this.cluster.database.guilds.getSetting(guild.id, 'greetChan');
        return this.findChannel(guild, channelId);
    }

    private findChannel(guild: Guild, channelId: string | undefined): GuildTextBasedChannels | undefined {
        if (channelId !== undefined) {
            const channel = guild.channels.cache.get(channelId);
            if (channel !== undefined && guard.isTextableChannel(channel))
                return channel;
        }

        return guild.channels.cache.find(guard.isTextableChannel);
    }
}
