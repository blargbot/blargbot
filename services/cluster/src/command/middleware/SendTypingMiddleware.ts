import { CommandResult } from '@blargbot/cluster/types.js';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';

import { CommandContext } from '../CommandContext.js';

export class SendTypingMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        await context.channel.sendTyping();
        return await next();
    }
}
