import { CommandDefinition, CommandMiddleware, CommandOptions, CommandResult } from '@cluster/types';
import { SendPayload } from '@core/types';

import { BaseCommand } from './BaseCommand';
import { CommandContext } from './CommandContext';
import { compileSignatures } from './compilation';
import { HandlerMiddleware } from './middleware';

// Circular reference means this needs to be resolved asyncronously;
const helpCommandPromise = import('@cluster/dcommands/help');

export abstract class ScopedCommandBase<TContext extends CommandContext> extends BaseCommand {
    private readonly handler: HandlerMiddleware<TContext>;
    protected readonly middleware: Array<CommandMiddleware<TContext>>;

    public get debugView(): string { return this.handler.debugView; }

    public constructor(options: CommandOptions<TContext>, noHelp = false) {
        const definitions: ReadonlyArray<CommandDefinition<TContext>> = noHelp ? options.definitions : [
            {
                parameters: 'help {subcommand?}',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                execute: (context, [subcommand]) => this.showHelp(context, this, subcommand),
                description: 'Gets the help message for this command'
            },
            ...options.definitions
        ];

        const signatures = compileSignatures(definitions);

        super({ ...options, signatures });

        this.middleware = [];
        this.handler = new HandlerMiddleware(signatures, this);
    }

    public abstract checkContext(context: CommandContext): context is TContext;
    protected abstract handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult;

    public async execute(context: CommandContext): Promise<void> {
        if (!this.checkContext(context)) {
            const result = await this.handleInvalidContext(context);
            await HandlerMiddleware.send(context, result);
            return;
        }

        const runMiddleware = (index: number): Promise<void> => {
            if (index < this.middleware.length)
                return this.middleware[index].execute(context, () => runMiddleware(index + 1));
            return this.handler.execute(context);
        };

        await runMiddleware(0);
    }

    protected async showHelp(context: CommandContext, command: BaseCommand, subcommand?: string): Promise<SendPayload> {
        const { HelpCommand: helpCommandClass } = await helpCommandPromise;
        const help = context.cluster.commands.get('help', helpCommandClass);
        return await help?.viewDefaultCommand(context, command, subcommand) ?? this.error('Unable to load help, please try again later');
    }
}
