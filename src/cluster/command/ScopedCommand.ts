import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities';
import { CommandDefinition, CommandOptions, CommandResult } from '@blargbot/cluster/types';
import { commandTypeDetails, runMiddleware } from '@blargbot/cluster/utils';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { Guild, KnownTextableChannel, User } from 'eris';

import { Command } from './Command';
import { CommandContext } from './CommandContext';
import { compileSignatures } from './compilation';
import { InvokeCommandHandlerMiddleware } from './middleware';

export abstract class ScopedCommand<TContext extends CommandContext> extends Command {
    private readonly handler: InvokeCommandHandlerMiddleware<TContext>;
    protected readonly middleware: Array<IMiddleware<TContext, CommandResult>>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(options: CommandOptions<TContext>, noHelp = false) {
        const definitions: ReadonlyArray<CommandDefinition<TContext>> = noHelp ? options.definitions : [
            {
                parameters: 'help {page:integer=1}',
                execute: (context, [page]) => context.cluster.help.viewCommand(context.channel, context.author, context.prefix, this.name, page.asInteger - 1),
                description: 'Gets the help message for this command',
                hidden: true
            },
            ...options.definitions
        ];

        const signatures = compileSignatures(definitions);

        super({ ...options, signatures });

        this.middleware = [];
        this.handler = new InvokeCommandHandlerMiddleware(signatures, this);
    }

    public async isVisible(util: ClusterUtilities, location?: Guild | KnownTextableChannel, user?: User): Promise<boolean> {
        return await commandTypeDetails[this.category].isVisible(util, location, user);
    }

    protected abstract guardContext(context: CommandContext): context is TContext;
    protected abstract handleInvalidContext(context: CommandContext): Awaitable<CommandResult>;

    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        if (!this.guardContext(context))
            return await this.handleInvalidContext(context);

        return await runMiddleware([...this.middleware, this.handler], context, next);
    }
}
