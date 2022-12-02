import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities.js';
import { CommandDefinition, CommandOptions, CommandResult } from '@blargbot/cluster/types.js';
import { commandTypeDetails, runMiddleware } from '@blargbot/cluster/utils/index.js';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import Eris from 'eris';

import templates from '../text.js';
import { Command } from './Command.js';
import { CommandContext } from './CommandContext.js';
import { compileSignatures } from './compilation/index.js';
import { InvokeCommandHandlerMiddleware } from './middleware/index.js';

export abstract class ScopedCommand<TContext extends CommandContext> extends Command {
    readonly #handler: InvokeCommandHandlerMiddleware<TContext>;
    protected readonly middleware: Array<IMiddleware<TContext, CommandResult>>;

    public get debugView(): string { return this.#handler.debugView; }

    public constructor(options: CommandOptions<TContext>, noHelp = false) {
        const definitions: ReadonlyArray<CommandDefinition<TContext>> = noHelp ? options.definitions : [
            {
                parameters: 'help',
                execute: (context) => context.cluster.help.createMessageContent(this.name, context.author, context.channel),
                description: templates.commands.help.command.description,
                hidden: true
            },
            ...options.definitions
        ];

        const signatures = compileSignatures(definitions);

        super({ ...options, signatures });

        this.middleware = [];
        this.#handler = new InvokeCommandHandlerMiddleware(signatures, this);
    }

    public async isVisible(util: ClusterUtilities, location?: Eris.Guild | Eris.KnownTextableChannel, user?: Eris.User): Promise<boolean> {
        return await commandTypeDetails[this.category].isVisible(util, location, user);
    }

    protected abstract guardContext(context: CommandContext): context is TContext;
    protected abstract handleInvalidContext(context: CommandContext): Awaitable<CommandResult>;

    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        if (!this.guardContext(context))
            return await this.handleInvalidContext(context);

        return await runMiddleware([...this.middleware, this.#handler], context, next);
    }
}
