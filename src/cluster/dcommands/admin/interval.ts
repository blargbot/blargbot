import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult';
import templates from '../../text';

const cmd = templates.commands.interval;

export class IntervalCommand extends GuildCommand {
    public constructor() {
        super({
            name: `interval`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `set {~bbtag+}`,
                    description: cmd.set.description,
                    execute: (ctx, [bbtag]) => this.setInterval(ctx, bbtag.asString)
                },
                {
                    parameters: `raw {fileExtension:literal(bbtag|txt)=bbtag}`,
                    description: cmd.raw.description,
                    execute: (ctx, [fileExtension]) => this.getRaw(ctx, fileExtension.asLiteral)
                },
                {
                    parameters: `delete`,
                    description: cmd.delete.description,
                    execute: (ctx) => this.deleteInterval(ctx)
                },
                {
                    parameters: `setauthorizer`,
                    description: cmd.setAuthorizer.description,
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: `debug`,
                    description: cmd.debug.description,
                    execute: (ctx) => this.debug(ctx)
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
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return cmd.errors.notSet;

        return cmd.info.success({ authorId: interval.author ?? `????`, authorizerId: interval.authorizer ?? interval.author ?? `????` });
    }

    public async setInterval(context: GuildCommandContext, code: string): Promise<CommandResult> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id) ?? {};
        await context.database.guilds.setInterval(context.channel.guild.id, { ...interval, content: code, author: context.author.id });
        return cmd.set.success;
    }

    public async getRaw(context: GuildCommandContext, fileExtension: string): Promise<CommandResult> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return cmd.errors.notSet;

        return new RawBBTagCommandResult(
            cmd.raw.inline({ content: interval.content }),
            cmd.raw.attached,
            interval.content,
            `interval.${fileExtension}`
        );
    }

    public async deleteInterval(context: GuildCommandContext): Promise<CommandResult> {
        await context.database.guilds.setInterval(context.channel.guild.id, undefined);
        return cmd.delete.success;
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<CommandResult> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return cmd.errors.notSet;

        await context.database.guilds.setInterval(context.channel.guild.id, { ...interval, authorizer: context.author.id });
        return cmd.setAuthorizer.success;
    }

    public async debug(context: GuildCommandContext): Promise<CommandResult> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return cmd.errors.notSet;

        const result = await context.cluster.intervals.invoke(context.channel.guild, interval);
        switch (result) {
            case `FAILED`: return cmd.debug.failed;
            case `MISSING_AUTHORIZER`: return cmd.debug.authorizerMissing;
            case `MISSING_CHANNEL`: return cmd.debug.channelMissing;
            case `TOO_LONG`: return cmd.debug.timedOut({ max: context.cluster.intervals.timeLimit });
            default:
                await context.send(context.author, bbtag.createDebugOutput(result));
                return cmd.debug.success;
        }
    }
}
