import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '../../command/index';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, guard } from '@blargbot/cluster/utils';
import { KnownChannel } from 'eris';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult';
import templates from '../../text';

const cmd = templates.commands.farewell;

export class FarewellCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'farewell',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'set {~bbtag+}',
                    description: cmd.set.description,
                    execute: (ctx, [bbtag]) => this.setFarewell(ctx, bbtag.asString)
                },
                {
                    parameters: 'raw {fileExtension:literal(bbtag|txt)=bbtag}',
                    description: cmd.raw.description,
                    execute: (ctx, [fileExtension]) => this.getFarewell(ctx, fileExtension.asLiteral)
                },
                {
                    parameters: 'setauthorizer',
                    description: cmd.setAuthorizer.description,
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: 'setchannel {channel:channel+}',
                    description: cmd.setChannel.description,
                    execute: (ctx, [channel]) => this.setChannel(ctx, channel.asChannel)
                },
                {
                    parameters: 'debug',
                    description: cmd.debug.description,
                    execute: (ctx) => this.debug(ctx)
                },
                {
                    parameters: 'delete|clear',
                    description: cmd.delete.description,
                    execute: (ctx) => this.deleteFarewell(ctx)
                },
                {
                    parameters: 'info',
                    description: cmd.info.description,
                    execute: (ctx) => this.getInfo(ctx)
                }
            ]
        });
    }

    public async getInfo(context: GuildCommandContext): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return cmd.errors.notSet;

        return cmd.info.success({ authorId: farewell.author ?? '????', authorizerId: farewell.authorizer ?? farewell.author ?? '????' });
    }

    public async setFarewell(context: GuildCommandContext, message: string): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id) ?? {};
        await context.database.guilds.setFarewell(context.channel.guild.id, {
            ...farewell,
            content: message,
            author: context.author.id
        });

        return cmd.set.success;
    }

    public async getFarewell(context: GuildCommandContext, fileExtension: string): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return cmd.errors.notSet;

        return new RawBBTagCommandResult(
            cmd.raw.inline({ content: farewell.content }),
            cmd.raw.attached,
            farewell.content,
            `farewell.${fileExtension}`
        );
    }

    public async deleteFarewell(context: GuildCommandContext): Promise<CommandResult> {
        await context.database.guilds.setFarewell(context.channel.guild.id, undefined);
        return cmd.delete.success;
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<CommandResult> {
        const farewell = await context.database.guilds.getFarewell(context.channel.guild.id);
        if (farewell === undefined)
            return cmd.errors.notSet;

        await context.database.guilds.setFarewell(context.channel.guild.id, {
            ...farewell,
            authorizer: context.author.id
        });
        return cmd.setAuthorizer.success;
    }

    public async setChannel(context: GuildCommandContext, channel: KnownChannel): Promise<CommandResult> {
        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return cmd.setChannel.notOnGuild;
        if (!guard.isTextableChannel(channel))
            return cmd.setChannel.notTextChannel;

        await context.database.guilds.setSetting(context.channel.guild.id, 'farewellchan', channel.id);
        return cmd.setChannel.success({ channel });
    }

    public async debug(context: GuildCommandContext): Promise<CommandResult> {
        const result = await context.cluster.greetings.farewell(context.message.member);
        switch (result) {
            case 'CHANNEL_MISSING': return cmd.debug.channelMissing;
            case 'CODE_MISSING': return cmd.errors.notSet;
            default:
                await context.send(context.author, bbtag.createDebugOutput(result));
                return cmd.debug.success;
        }
    }
}
