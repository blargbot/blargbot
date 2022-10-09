import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { codeBlock, CommandType, guard } from '@blargbot/cluster/utils';
import { KnownChannel } from 'eris';

import templates from '../../text';

const cmd = templates.commands.farewell;

export class FarewellCommand extends GuildCommand {
    public constructor() {
        super({
            name: `farewell`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `set {~bbtag+}`,
                    description: cmd.set.description,
                    execute: (ctx, [bbtag]) => this.setFarewell(ctx, bbtag.asString)
                },
                {
                    parameters: `raw {fileExtension:literal(bbtag|txt)=bbtag}`,
                    description: cmd.raw.description,
                    execute: (ctx, [fileExtension]) => this.getFarewell(ctx, fileExtension.asLiteral)
                },
                {
                    parameters: `setauthorizer`,
                    description: cmd.setauthorizer.description,
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: `setchannel {channel:channel+}`,
                    description: cmd.setchannel.description,
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel.asChannel)
                },
                {
                    parameters: `debug`,
                    description: cmd.debug.description,
                    execute: (ctx) => this.debug(ctx)
                },
                {
                    parameters: `delete|clear`,
                    description: cmd.delete.description,
                    execute: (ctx) => this.deleteFarewell(ctx)
                },
                {
                    parameters: `info`,
                    description: cmd.info.description,
                    execute: (ctx) => this.getInfo(ctx)
                }
            ]
        });
    }

    public async getInfo(context: GuildCommandContext): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return `❌ No farewell message has been set yet!`;

        const authorizer = farewell.authorizer ?? farewell.author;
        return `ℹ️ The current farewell was last edited by <@${farewell.author ?? 0}> (${farewell.author ?? `????`}) and is authorized by <@${authorizer ?? 0}> (${authorizer ?? `????`})`;
    }

    public async setFarewell(context: GuildCommandContext, message: string): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id) ?? {};
        await context.database.guilds.setFarewell(context.channel.guild.id, {
            ...farewell,
            content: message,
            author: context.author.id
        });

        return `✅ The farewell message has been set`;
    }

    public async getFarewell(context: GuildCommandContext, fileExtension: string): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return `❌ No farewell message has been set yet!`;

        const channel = await context.cluster.greetings.getFarewellChannel(context.channel.guild.id);

        const message = channel === undefined
            ? `The raw code for the farewell message is`
            : `The raw code for the farewell message (sent in ${channel.mention}) is`;
        const response = `ℹ️ ${message}:\n${codeBlock(farewell.content)}`;

        return !farewell.content.includes(`\`\`\``) && guard.checkMessageSize(response)
            ? response
            : {
                content: `ℹ️ ${message} attached`,
                files: [
                    {
                        name: `farewell.${fileExtension}`,
                        file: farewell.content
                    }
                ]
            };
    }

    public async deleteFarewell(context: GuildCommandContext): Promise<CommandResult> {
        await context.database.guilds.setFarewell(context.channel.guild.id, undefined);
        return `✅ Farewell messages will no longer be sent`;
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return `❌ There isnt a farewell message set!`;

        await context.database.guilds.setFarewell(context.channel.guild.id, {
            ...farewell,
            authorizer: context.author.id
        });
        return `✅ The farewell message will now run using your permissions`;
    }

    public async setChannel(context: GuildCommandContext, channel: KnownChannel): Promise<CommandResult> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return `❌ The farewell channel must be on this server!`;
        if (!guard.isTextableChannel(channel))
            return `❌ The farewell channel must be a text channel!`;

        await context.database.guilds.setSetting(context.channel.guild.id, `farewellchan`, channel.id);
        return `✅ Farewell messages will now be sent in ${channel.mention}`;
    }

    public async debug(context: GuildCommandContext): Promise<CommandResult> {
        const result = await context.cluster.greetings.farewell(context.message.member);
        switch (result) {
            case `CHANNEL_MISSING`: return `❌ I wasnt able to locate a channel to sent the message in!`;
            case `CODE_MISSING`: return `❌ There isnt a farewell message set!`;
            default:
                await context.sendDM(bbtag.createDebugOutput(result));
                return `ℹ️ Ive sent the debug output in a DM`;
        }
    }
}
