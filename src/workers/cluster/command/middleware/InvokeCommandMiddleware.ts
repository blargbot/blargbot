import { CommandResult } from '@cluster/types';
import { guard } from '@cluster/utils';
import { Logger } from '@core/Logger';
import { MessageIdQueue } from '@core/MessageIdQueue';
import { IMiddleware } from '@core/types';

import { CommandContext } from '../CommandContext';

export class InvokeCommandMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public constructor(
        private readonly type: string,
        private readonly messageIdQueue: MessageIdQueue,
        private readonly logger: Logger
    ) {
    }

    public async execute(context: CommandContext): Promise<CommandResult> {
        const outputLog = guard.isGuildCommandContext(context)
            ? `${this.type} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
            : `${this.type} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
        this.logger.command(outputLog);

        if (guard.isGuildCommandContext(context))
            this.messageIdQueue.push(context.channel.guild.id, context.message.channel.id);

        await context.channel.sendTyping();
        await context.command.execute(context);
        return undefined;
    }
}
