import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { codeBlock, CommandType, guard } from '@blargbot/cluster/utils';
import { SendContent } from '@blargbot/core/types';
import { KnownChannel } from 'eris';

export class GreetingCommand extends GuildCommand {
    public constructor() {
        super({
            name: `greeting`,
            aliases: [`greet`],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `set {~bbtag+}`,
                    description: `Sets the message to send when someone joins the server`,
                    execute: (ctx, [bbtag]) => this.setGreeting(ctx, bbtag.asString)
                },
                {
                    parameters: `raw {fileExtension:literal(bbtag|txt)=bbtag}`,
                    description: `Gets the current message that will be sent when someone joins the server`,
                    execute: (ctx, [fileExtension]) => this.getGreeting(ctx, fileExtension.asLiteral)
                },
                {
                    parameters: `setauthorizer`,
                    description: `Sets the greeting message to use your permissions when running`,
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: `setchannel {channel:channel+}`,
                    description: `Sets the channel the greeting message will be sent in.`,
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel.asChannel)
                },
                {
                    parameters: `debug`,
                    description: `Executes the greeting message as if you left the server and provides the debug output.`,
                    execute: (ctx) => this.debug(ctx)
                },
                {
                    parameters: `delete|clear`,
                    description: `Deletes the current greeting message.`,
                    execute: (ctx) => this.deleteGreeting(ctx)
                },
                {
                    parameters: `info`,
                    description: `Shows information about the current greeting message`,
                    execute: (ctx) => this.getInfo(ctx)
                }
            ]
        });
    }

    public async getInfo(context: GuildCommandContext): Promise<string> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return `❌ No greeting message has been set yet!`;

        const authorizer = greeting.authorizer ?? greeting.author;
        return `ℹ️ The current greeting was last edited by <@${greeting.author ?? 0}> (${greeting.author ?? `????`}) and is authorized by <@${authorizer ?? 0}> (${authorizer ?? `????`})`;
    }

    public async setGreeting(context: GuildCommandContext, message: string): Promise<string> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id) ?? {};
        await context.database.guilds.setGreeting(context.channel.guild.id, {
            ...greeting,
            content: message,
            author: context.author.id
        });

        return `✅ The greeting message has been set`;
    }

    public async getGreeting(context: GuildCommandContext, fileExtension: string): Promise<string | SendContent> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return `❌ No greeting message has been set yet!`;

        const channel = await context.cluster.greetings.getGreetingChannel(context.channel.guild.id);

        const message = channel === undefined
            ? `The raw code for the greeting message is`
            : `The raw code for the greeting message (sent in ${channel.mention}) is`;
        const response = `ℹ️ ${message}:\n${codeBlock(greeting.content)}`;

        return !greeting.content.includes(`\`\`\``) && guard.checkMessageSize(response)
            ? response
            : {
                content: `ℹ️ ${message} attached`,
                files: [
                    {
                        name: `greeting.${fileExtension}`,
                        file: greeting.content
                    }
                ]
            };
    }

    public async deleteGreeting(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.setGreeting(context.channel.guild.id, undefined);
        return `✅ Greeting messages will no longer be sent`;
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<string> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return `❌ There isnt a greeting message set!`;

        await context.database.guilds.setGreeting(context.channel.guild.id, {
            ...greeting,
            authorizer: context.author.id
        });
        return `✅ The greeting message will now run using your permissions`;
    }

    public async setChannel(context: GuildCommandContext, channel: KnownChannel): Promise<string> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return `❌ The greeting channel must be on this server!`;
        if (!guard.isTextableChannel(channel))
            return `❌ The greeting channel must be a text channel!`;

        await context.database.guilds.setSetting(context.channel.guild.id, `greetchan`, channel.id);
        return `✅ Greeting messages will now be sent in ${channel.mention}`;
    }

    public async debug(context: GuildCommandContext): Promise<string | SendContent> {
        const result = await context.cluster.greetings.greet(context.message.member);
        switch (result) {
            case `CHANNEL_MISSING`: return `❌ I wasnt able to locate a channel to sent the message in!`;
            case `CODE_MISSING`: return `❌ There isnt a greeting message set!`;
            default:
                await context.sendDM(bbtag.createDebugOutput(result));
                return `ℹ️ Ive sent the debug output in a DM`;
        }
    }
}
