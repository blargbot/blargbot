import { CommandResult } from '@blargbot/cluster/types';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { guard, snowflake } from '@blargbot/core/utils';
import { ApiError, DiscordRESTError } from 'eris';

import { CommandContext } from '../CommandContext';

export class ErrorMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    public async execute(context: TContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        try {
            return await next();
        } catch (err: unknown) {
            const token = snowflake.create().toString();
            context.logger.error(`[Command error ${token}]`, context.command.name, err);

            if (err instanceof DiscordRESTError
                && err.code === ApiError.MISSING_ACCESS
                && await context.database.users.getSetting(context.author.id, `dontdmerrors`) !== true) {
                const message = !guard.isGuildChannel(context.channel)
                    ? `❌ Oops, I dont seem to have permission to do that!`
                    : `❌ Hi! You asked me to do something, but I didn't have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: ${context.channel.guild.name}\nChannel: ${context.channel.mention}\nCommand: ${context.commandText}\n\nIf you wish to stop seeing these messages, do the command \`${context.prefix}dmerrors\`.`;
                await context.util.sendDM(context.author, message);
            }

            return `❌ Something went wrong while handling your command!\nError id: \`${token}\``;
        }
    }
}
