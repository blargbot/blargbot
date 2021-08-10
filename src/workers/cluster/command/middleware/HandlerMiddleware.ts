import { CommandHandler, CommandMiddleware, CommandResult, CommandSignatureHandler } from '@cluster/types';
import { Message } from 'discord.js';

import { CommandContext } from '../CommandContext';
import { compileHandler } from '../compilation';
import { ScopedCommandBase } from '../ScopedCommandBase';

export class HandlerMiddleware<TContext extends CommandContext> implements CommandMiddleware<TContext> {
    private readonly handler: CommandHandler<TContext>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(signatures: ReadonlyArray<CommandSignatureHandler<TContext>>, command: ScopedCommandBase<TContext>) {
        this.handler = compileHandler(signatures, command);
    }

    public static async send<TContext extends CommandContext>(context: TContext, result: CommandResult): Promise<Message | undefined> {
        switch (typeof result) {
            case 'undefined':
                return undefined;
            case 'boolean':
            case 'string':
                return await context.reply(result);
            case 'object':
                if (Array.isArray(result))
                    return await context.reply({ files: result });
                if ('attachment' in result)
                    return await context.reply({ files: [result] });
                return await context.reply(result);
        }

    }

    public async execute(context: TContext): Promise<void> {
        const result = await this.handler.execute(context);
        await HandlerMiddleware.send(context, result);
    }
}
