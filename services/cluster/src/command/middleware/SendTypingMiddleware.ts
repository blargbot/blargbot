import type { CommandResult } from '@blargbot/cluster/types.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';

import type { CommandContext } from '../CommandContext.js';

export class SendTypingMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        await context.channel.sendTyping();
        return await next();
    }
}