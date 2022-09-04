import { CommandHandler, CommandResult, CommandSignatureHandler } from '@blargbot/cluster/types';
import { IMiddleware } from '@blargbot/core/types';

import { CommandContext } from '../CommandContext';
import { compileHandler } from '../compilation';
import { ScopedCommand } from '../ScopedCommand';

export class InvokeCommandHandlerMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    public readonly name: string;
    readonly #handler: CommandHandler<TContext>;

    public get debugView(): string { return this.#handler.debugView; }

    public constructor(signatures: ReadonlyArray<CommandSignatureHandler<TContext>>, command: ScopedCommand<TContext>) {
        this.#handler = compileHandler(signatures, command);
        this.name = command.name;
    }

    public async execute(context: TContext): Promise<CommandResult> {
        return await this.#handler.execute(context);
    }
}
