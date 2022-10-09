import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, guard } from '@blargbot/cluster/utils';
import { KnownChannel } from 'eris';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult';
import templates from '../../text';

const cmd = templates.commands.greeting;

export class GreetingCommand extends GuildCommand {
    public constructor() {
        super({
            name: `greeting`,
            aliases: [`greet`],
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `set {~bbtag+}`,
                    description: cmd.set.description,
                    execute: (ctx, [bbtag]) => this.setGreeting(ctx, bbtag.asString)
                },
                {
                    parameters: `raw {fileExtension:literal(bbtag|txt)=bbtag}`,
                    description: cmd.raw.description,
                    execute: (ctx, [fileExtension]) => this.getGreeting(ctx, fileExtension.asLiteral)
                },
                {
                    parameters: `setauthorizer`,
                    description: cmd.setAuthorizer.description,
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: `setchannel {channel:channel+}`,
                    description: cmd.setChannel.description,
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
                    execute: (ctx) => this.deleteGreeting(ctx)
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
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return cmd.errors.notSet;

        return cmd.info.success({ authorId: greeting.author ?? `????`, authorizerId: greeting.authorizer ?? greeting.author ?? `????` });
    }

    public async setGreeting(context: GuildCommandContext, message: string): Promise<CommandResult> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id) ?? {};
        await context.database.guilds.setGreeting(context.channel.guild.id, {
            ...greeting,
            content: message,
            author: context.author.id
        });

        return cmd.set.success;
    }

    public async getGreeting(context: GuildCommandContext, fileExtension: string): Promise<CommandResult> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return cmd.errors.notSet;

        return new RawBBTagCommandResult(
            cmd.raw.inline({ content: greeting.content }),
            cmd.raw.attached,
            greeting.content,
            `greeting.${fileExtension}`
        );
    }

    public async deleteGreeting(context: GuildCommandContext): Promise<CommandResult> {
        await context.database.guilds.setGreeting(context.channel.guild.id, undefined);
        return cmd.delete.success;
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<CommandResult> {
        const greeting = await context.database.guilds.getGreeting(context.channel.guild.id);
        if (greeting === undefined)
            return cmd.errors.notSet;

        await context.database.guilds.setGreeting(context.channel.guild.id, {
            ...greeting,
            authorizer: context.author.id
        });
        return cmd.setAuthorizer.success;
    }

    public async setChannel(context: GuildCommandContext, channel: KnownChannel): Promise<CommandResult> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return cmd.setChannel.notOnGuild;
        if (!guard.isTextableChannel(channel))
            return cmd.setChannel.notTextChannel;

        await context.database.guilds.setSetting(context.channel.guild.id, `greetchan`, channel.id);
        return cmd.setChannel.success({ channel });
    }

    public async debug(context: GuildCommandContext): Promise<CommandResult> {
        const result = await context.cluster.greetings.greet(context.message.member);
        switch (result) {
            case `CHANNEL_MISSING`: return cmd.debug.channelMissing;
            case `CODE_MISSING`: return cmd.errors.notSet;
            default:
                await context.send(context.author, bbtag.createDebugOutput(result));
                return cmd.debug.success;
        }
    }
}
