import type { CommandHandler, CommandResult, CommandSignatureHandler } from '@blargbot/cluster/types.js';
import type { IMiddleware } from '@blargbot/core/types.js';

import type { CommandContext } from '../CommandContext.js';
import { compileHandler } from '../compilation/index.js';
import type { ScopedCommand } from '../ScopedCommand.js';

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
