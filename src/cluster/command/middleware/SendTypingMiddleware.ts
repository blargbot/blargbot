import { CommandResult } from '@blargbot/cluster/types';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';

import { CommandContext } from '../CommandContext';

export class SendTypingMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        await context.channel.sendTyping();
        return await next();
    }
}
