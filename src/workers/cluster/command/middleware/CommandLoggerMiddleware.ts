import { CommandResult } from '@cluster/types';
import { guard } from '@cluster/utils';
import { IMiddleware } from '@core/types';

import { CommandContext } from '../CommandContext';

export class CommandLoggerMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public execute(context: CommandContext, next: () => Awaitable<CommandResult>): Awaitable<CommandResult> {
        const outputLog = guard.isGuildCommandContext(context)
            ? `${context.command.category} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
            : `${context.command.category} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
        context.logger.command(outputLog);

        if (guard.isGuildCommandContext(context))
            context.cluster.commands.messages.push(context.channel.guild.id, context.message.channel.id);

        return next();
    }
}
