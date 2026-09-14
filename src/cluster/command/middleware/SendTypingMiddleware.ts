import type { CommandResult } from '@blargbot/cluster';
import type { IMiddleware, NextMiddleware } from '@blargbot/core';
import { sleep } from '@blargbot/util';

import type { CommandContext } from '../CommandContext.js';

export class SendTypingMiddleware implements IMiddleware<CommandContext, CommandResult> {
    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        await context.channel.sendTyping();
        const resolved = new AbortController();
        const result = Promise.try(next).finally(() => resolved.abort());
        try {
            while (true) {
                await sleep(9_000, resolved.signal);
                await context.channel.sendTyping();
            }
        } catch { /* NO-OP */ }
        return await result;
    }
}
