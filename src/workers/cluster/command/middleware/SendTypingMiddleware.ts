import { CommandResult } from '@cluster/types';
import { IMiddleware } from '@core/types';

import { CommandContext } from '../CommandContext';

export class SendTypingMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public async execute(context: CommandContext, next: () => Awaitable<CommandResult>): Promise<CommandResult> {
        void context.channel.sendTyping();
        return await next();
    }
}
