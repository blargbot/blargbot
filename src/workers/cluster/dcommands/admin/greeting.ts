import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { bbtagUtil, codeBlock, CommandType, guard } from '@cluster/utils';
import { GuildChannels, MessageOptions } from 'discord.js';

export class GreetingCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'greeting',
            aliases: ['greet'],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'set {~message+}',
                    description: 'Sets the message to send when someone joins the server. This is bbtag compatible',
                    execute: (ctx, [message]) => this.setGreeting(ctx, message)
                },
                {
                    parameters: 'raw',
                    description: 'Gets the current message that will be sent when someone joins the server',
                    execute: (ctx) => this.getGreeting(ctx)
                },
                {
                    parameters: 'setauthorizer',
                    description: 'Sets the greeting message to use your permissions when running',
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: 'setchannel {channel:channel+}',
                    description: 'Sets the channel the greeting message will be sent in.',
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel)
                },
                {
                    parameters: 'debug',
                    description: 'Executes the greeting message as if you left the server and provides the debug output.',
                    execute: (ctx) => this.debug(ctx)
                },
                {
                    parameters: 'delete|clear',
                    description: 'Deletes the current greeting message.',
                    execute: (ctx) => this.deleteGreeting(ctx)
                },
                {
                    parameters: 'info',
                    description: 'Shows information about the current farewell message',
                    execute: (ctx) => this.getInfo(ctx)
                }
            ]
        });
    }

    public async getInfo(context: GuildCommandContext): Promise<string> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return this.error('No greeting message has been set yet!');

        const authorizer = greeting.authorizer ?? greeting.author;
        return this.info(`The current greeting was last edited by <@${greeting.author}> (${greeting.author}) and is authorized by <@${authorizer}> (${authorizer})`);
    }

    public async setGreeting(context: GuildCommandContext, message: string): Promise<string> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id) ?? {};
        await context.database.guilds.setGreeting(context.channel.guild.id, {
            ...greeting,
            content: message,
            author: context.author.id
        });

        return this.success('The greeting message has been set');
    }

    public async getGreeting(context: GuildCommandContext): Promise<string | MessageOptions> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return this.error('No greeting message has been set yet!');

        const channel = await context.cluster.greetings.getGreetingChannel(context.channel.guild.id);

        const message = channel === undefined
            ? 'The raw code for the greeting message is'
            : `The raw code for the greeting message (sent in ${channel.toString()}) is`;
        const response = this.info(`${message}:\n${codeBlock(greeting.content)}`);

        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.info(`${message} attached`),
                files: [
                    {
                        name: 'greeting.bbtag',
                        attachment: greeting.content
                    }
                ]
            };
    }

    public async deleteGreeting(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.setGreeting(context.channel.guild.id, undefined);
        return this.success('Greeting messages will no longer be sent');
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<string> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return this.error('There isnt a greeting message set!');

        await context.database.guilds.setGreeting(context.channel.guild.id, {
            ...greeting,
            authorizer: context.author.id
        });
        return this.success('The greeting message will now run using your permissions');
    }

    public async setChannel(context: GuildCommandContext, channel: GuildChannels): Promise<string> {
        if (!guard.isTextableChannel(channel))
            return this.error('Greeting messages can only be sent in text channels!');

        await context.database.guilds.setSetting(context.channel.guild.id, 'greetChan', channel.id);
        return this.success(`Greeting messages will now be sent in ${channel.toString()}`);
    }

    public async debug(context: GuildCommandContext): Promise<string | MessageOptions> {
        const result = await context.cluster.greetings.greet(context.message.member);
        switch (result) {
            case 'CHANNEL_MISSING': return this.error('I wasnt able to locate a channel to sent the message in!');
            case 'CODE_MISSING': return this.error('There isnt a greeting message set!');
            default: return bbtagUtil.createDebugOutput(result);
        }
    }
}
