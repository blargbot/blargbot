import { bbtag } from '@blargbot/bbtag';
import { BaseGuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { codeBlock, CommandType, guard } from '@blargbot/cluster/utils';
import { SendContent } from '@blargbot/core/types';
import { KnownChannel } from 'eris';

export class FarewellCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'farewell',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'set {~bbtag+}',
                    description: 'Sets the bbtag to send when someone leaves the server',
                    execute: (ctx, [bbtag]) => this.setFarewell(ctx, bbtag.asString)
                },
                {
                    parameters: 'raw',
                    description: 'Gets the current message that will be sent when someone leaves the server',
                    execute: (ctx) => this.getFarewell(ctx)
                },
                {
                    parameters: 'setauthorizer',
                    description: 'Sets the farewell message to use your permissions when running',
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: 'setchannel {channel:channel+}',
                    description: 'Sets the channel the farewell message will be sent in.',
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel.asChannel)
                },
                {
                    parameters: 'debug',
                    description: 'Executes the farewell message as if you left the server and provides the debug output.',
                    execute: (ctx) => this.debug(ctx)
                },
                {
                    parameters: 'delete|clear',
                    description: 'Deletes the current farewell message.',
                    execute: (ctx) => this.deleteFarewell(ctx)
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
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return this.error('No farewell message has been set yet!');

        const authorizer = farewell.authorizer ?? farewell.author;
        return this.info(`The current farewell was last edited by <@${farewell.author}> (${farewell.author}) and is authorized by <@${authorizer}> (${authorizer})`);
    }

    public async setFarewell(context: GuildCommandContext, message: string): Promise<string> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id) ?? {};
        await context.database.guilds.setFarewell(context.channel.guild.id, {
            ...farewell,
            content: message,
            author: context.author.id
        });

        return this.success('The farewell message has been set');
    }

    public async getFarewell(context: GuildCommandContext): Promise<string | SendContent> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return this.error('No farewell message has been set yet!');

        const channel = await context.cluster.greetings.getFarewellChannel(context.channel.guild.id);

        const message = channel === undefined
            ? 'The raw code for the farewell message is'
            : `The raw code for the farewell message (sent in ${channel.mention}) is`;
        const response = this.info(`${message}:\n${codeBlock(farewell.content)}`);

        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.info(`${message} attached`),
                files: [
                    {
                        name: 'farewell.bbtag',
                        file: farewell.content
                    }
                ]
            };
    }

    public async deleteFarewell(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.setFarewell(context.channel.guild.id, undefined);
        return this.success('Farewell messages will no longer be sent');
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<string> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return this.error('There isnt a farewell message set!');

        await context.database.guilds.setFarewell(context.channel.guild.id, {
            ...farewell,
            authorizer: context.author.id
        });
        return this.success('The farewell message will now run using your permissions');
    }

    public async setChannel(context: GuildCommandContext, channel: KnownChannel): Promise<string> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return this.error('The farewell channel must be on this server!');
        if (!guard.isTextableChannel(channel))
            return this.error('The farewell channel must be a text channel!');

        await context.database.guilds.setSetting(context.channel.guild.id, 'farewellchan', channel.id);
        return this.success(`Farewell messages will now be sent in ${channel.mention}`);
    }

    public async debug(context: GuildCommandContext): Promise<string | SendContent> {
        const result = await context.cluster.greetings.farewell(context.message.member);
        switch (result) {
            case 'CHANNEL_MISSING': return this.error('I wasnt able to locate a channel to sent the message in!');
            case 'CODE_MISSING': return this.error('There isnt a farewell message set!');
            default: return bbtag.createDebugOutput(result);
        }
    }
}
