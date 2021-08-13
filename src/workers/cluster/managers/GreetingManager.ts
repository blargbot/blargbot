import { Cluster } from '@cluster';
import { limits } from '@cluster/bbtag';
import { snowflake } from '@cluster/utils';
import { StoredRawGuildCommand } from '@core/types';
import { Collection, Guild, GuildMember, TextChannel } from 'discord.js';
import moment from 'moment';

export class GreetingManager {
    public constructor(protected readonly cluster: Cluster) {
    }

    public async greet(member: GuildMember): Promise<void> {
        const greeting = await this.cluster.database.guilds.getSetting(member.guild.id, 'greeting');
        if (typeof greeting !== 'object')
            return;

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'greetChan');
        const channel = this.findChannel(member.guild, channelId);
        if (channel === undefined)
            return;

        await this.execute(greeting, channel, member, 'greet');
    }

    public async farewell(member: GuildMember): Promise<void> {
        const farewell = await this.cluster.database.guilds.getSetting(member.guild.id, 'farewell');
        if (typeof farewell !== 'object')
            return;

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'farewellchan');
        const channel = this.findChannel(member.guild, channelId);
        if (channel === undefined)
            return;

        await this.execute(farewell, channel, member, 'farewell');
    }

    private async execute(command: StoredRawGuildCommand, channel: TextChannel, member: GuildMember, name: string): Promise<void> {
        await this.cluster.bbtag.execute(command.content, {
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
            cooldown: command.cooldown,
            flags: command.flags,
            silent: true,
            tagVars: false,
            rootTagName: name
        });
    }

    private findChannel(guild: Guild, channelId: string | undefined): TextChannel | undefined {
        if (channelId !== undefined) {
            const channel = guild.channels.cache.get(channelId);
            if (channel !== undefined && channel.type === 'GUILD_TEXT')
                return <TextChannel>channel;
        }

        return guild.channels.cache.find((channel): channel is TextChannel => channel.type === 'GUILD_TEXT');
    }
}
