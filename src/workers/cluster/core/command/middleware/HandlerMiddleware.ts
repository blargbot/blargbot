import { AnyMessage } from 'eris';
import { CommandResult } from '../..';
import { CommandHandler, CommandMiddleware, CommandSignatureHandler } from '../../types';
import { CommandContext } from '../CommandContext';
import { compileHandler } from '../compilation';
import { ScopedCommandBase } from '../ScopedCommandBase';

export class HandlerMiddleware<TContext extends CommandContext> implements CommandMiddleware<TContext> {
    private readonly handler: CommandHandler<TContext>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(signatures: ReadonlyArray<CommandSignatureHandler<TContext>>, command: ScopedCommandBase<TContext>) {
        this.handler = compileHandler(signatures, command);
    }

    public static async send<TContext extends CommandContext>(context: TContext, result: CommandResult): Promise<AnyMessage | undefined> {
        switch (typeof result) {
            case 'undefined':
                return undefined;
            case 'boolean':
            case 'string':
                return await context.reply(result);
            case 'object':
                if ('file' in result || Array.isArray(result))
                    return await context.reply(undefined, result);
                else if ('files' in result)
                    return await context.reply(result.content, result.files);
                return await context.reply(result);
        }

    }

    public async execute(context: TContext): Promise<void> {
        const result = await this.handler.execute(context);
        await HandlerMiddleware.send(context, result);
    }
}
