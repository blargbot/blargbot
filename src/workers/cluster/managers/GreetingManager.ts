import { Constants, Guild, Member, TextChannel } from 'eris';
import moment from 'moment';
import { Cluster } from '../Cluster';
import { limits, snowflake, StoredRawGuildCommand } from '@cluster/core';

export class GreetingManager {
    public constructor(protected readonly cluster: Cluster) {
    }

    public async greet(member: Member): Promise<void> {
        const greeting = await this.cluster.database.guilds.getSetting(member.guild.id, 'greeting');
        if (typeof greeting !== 'object')
            return;

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'greetChan');
        const channel = this.findChannel(member.guild, channelId);
        if (channel === undefined)
            return;

        await this.execute(greeting, channel, member, 'greet');
    }

    public async farewell(member: Member): Promise<void> {
        const farewell = await this.cluster.database.guilds.getSetting(member.guild.id, 'farewell');
        if (typeof farewell !== 'object')
            return;

        const channelId = await this.cluster.database.guilds.getSetting(member.guild.id, 'farewellchan');
        const channel = this.findChannel(member.guild, channelId);
        if (channel === undefined)
            return;

        await this.execute(farewell, channel, member, 'farewell');
    }

    private async execute(command: StoredRawGuildCommand, channel: TextChannel, member: Member, name: string): Promise<void> {
        await this.cluster.bbtag.execute(command.content, {
            author: command.author,
            inputRaw: '',
            isCC: true,
            limit: new limits.customCommandLimit(),
            message: {
                attachments: [],
                author: member.user,
                channel: channel,
                content: '',
                embeds: [],
                id: snowflake.create().toString(),
                member: member,
                timestamp: moment().valueOf()
            },
            authorizer: command.authorizer,
            cooldown: command.cooldown,
            flags: command.flags,
            silent: true,
            tagVars: false,
            tagName: name
        });
    }

    private findChannel(guild: Guild, channelId: string | undefined): TextChannel | undefined {
        if (channelId !== undefined) {
            const channel = guild.channels.get(channelId);
            if (channel !== undefined && channel.type === Constants.ChannelTypes.GUILD_TEXT)
                return channel;
        }

        return guild.channels.find((channel): channel is TextChannel => channel.type === Constants.ChannelTypes.GUILD_TEXT);
    }
}
