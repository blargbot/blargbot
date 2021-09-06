import { CommandHandler, CommandResult, CommandSignatureHandler } from '@cluster/types';
import { IMiddleware } from '@core/types';

import { CommandContext } from '../CommandContext';
import { compileHandler } from '../compilation';
import { ScopedCommandBase } from '../ScopedCommandBase';

export class InvokeCommandHandlerMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    private readonly handler: CommandHandler<TContext>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(signatures: ReadonlyArray<CommandSignatureHandler<TContext>>, command: ScopedCommandBase<TContext>) {
        this.handler = compileHandler(signatures, command);
    }

    public async execute(context: TContext): Promise<CommandResult> {
        return await this.handler.execute(context);
    }
}
