import { ClusterUtilities } from '@cluster/ClusterUtilities';
import { CommandDefinition, CommandOptions, CommandResult } from '@cluster/types';
import { commandTypeDetails, runMiddleware } from '@cluster/utils';
import { IMiddleware } from '@core/types';
import { Guild, TextBasedChannels, User } from 'discord.js';

import { BaseCommand } from './BaseCommand';
import { CommandContext } from './CommandContext';
import { compileSignatures } from './compilation';
import { InvokeCommandHandlerMiddleware } from './middleware';

export abstract class ScopedCommandBase<TContext extends CommandContext> extends BaseCommand {
    private readonly handler: InvokeCommandHandlerMiddleware<TContext>;
    protected readonly middleware: Array<IMiddleware<TContext, CommandResult>>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(options: CommandOptions<TContext>, noHelp = false) {
        const definitions: ReadonlyArray<CommandDefinition<TContext>> = noHelp ? options.definitions : [
            {
                parameters: 'help {page:integer=1}',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

    public async isVisible(util: ClusterUtilities, location?: Guild | TextBasedChannels, user?: User): Promise<boolean> {
        return await commandTypeDetails[this.category].isVisible(util, location, user);
    }

    protected abstract guardContext(context: CommandContext): context is TContext;
    protected abstract handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult;

    public async execute(context: CommandContext): Promise<void> {
        if (!this.guardContext(context)) {
            const result = await this.handleInvalidContext(context);
            if (result !== undefined)
                await context.reply(result);
            return;
        }

        const result = await runMiddleware([...this.middleware, this.handler], context, undefined);
        await context.reply(result);
    }
}
