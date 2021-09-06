import { ClusterUtilities } from '@cluster/ClusterUtilities';
import { CommandDefinition, CommandOptions, CommandResult } from '@cluster/types';
import { commandTypeDetails } from '@cluster/utils';
import { IMiddleware, SendPayload } from '@core/types';
import { Guild, TextBasedChannels, User } from 'discord.js';

import { BaseCommand } from './BaseCommand';
import { CommandContext } from './CommandContext';
import { compileSignatures } from './compilation';
import { HandlerMiddleware } from './middleware';
import { ErrorMiddleware } from './middleware/ErrorMiddleware';

// Circular reference means this needs to be resolved asyncronously;
const helpCommandPromise = import('@cluster/dcommands/general/help');

export abstract class ScopedCommandBase<TContext extends CommandContext> extends BaseCommand {
    private readonly handler: HandlerMiddleware<TContext>;
    protected readonly middleware: Array<IMiddleware<TContext, CommandResult>>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(options: CommandOptions<TContext>, noHelp = false) {
        const definitions: ReadonlyArray<CommandDefinition<TContext>> = noHelp ? options.definitions : [
            {
                parameters: 'help {subcommand+?} {page:number=1}',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                execute: (context, [subcommand, page]) => this.showHelp(context, this, page - 1, subcommand),
                description: 'Gets the help message for this command',
                hidden: true
            },
            ...options.definitions
        ];

        const signatures = compileSignatures(definitions);

        super({ ...options, signatures });

        this.middleware = [new ErrorMiddleware(this)];
        this.handler = new HandlerMiddleware(signatures, this);
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

        const runMiddleware = (context: TContext, index: number): Awaitable<CommandResult> => {
            if (index < this.middleware.length)
                return this.middleware[index].execute(context, (ctx) => runMiddleware(ctx ?? context, index + 1));
            return this.handler.execute(context);
        };

        await context.reply(await runMiddleware(context, 0));
    }

    protected async showHelp(context: CommandContext, command: BaseCommand, page: number, subcommand: string): Promise<SendPayload> {
        // TODO transition to using a worker
        const { HelpCommand: helpCommandClass } = await helpCommandPromise;
        const help = await context.cluster.commands.default.get('help');
        if (help.state === 'ALLOWED' && help.detail.implementation instanceof helpCommandClass)
            return await help.detail.implementation.viewCommand(context, command.name, page, subcommand);
        return this.error('Unable to load help, please try again later');
    }
}
