import { CommandResult } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';

import { CommandContext } from '../CommandContext';

export class CommandLoggerMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public execute(context: CommandContext, next: NextMiddleware<CommandResult>): Awaitable<CommandResult> {
        const outputLog = guard.isGuildCommandContext(context)
            ? `${context.command.category} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
            : `${context.command.category} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
        context.logger.command(outputLog);

        if (guard.isGuildCommandContext(context))
            context.cluster.commands.messages.push(context.channel.id, context.message.id);

        return next();
    }
}
