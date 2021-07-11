import { CommandContext, BaseCommand } from '../command';
import { SendPayload } from '../globalCore';
import { CommandDefinition, CommandOptions, CommandResult, CommandSignature } from '../types';
import { compileHandler, compileSignatures } from './compilation';

// Circular reference means this needs to be resolved asyncronously;
const helpCommandPromise = import('../../dcommands/help');

export abstract class ScopedCommandBase<TContext extends CommandContext> extends BaseCommand {
    public readonly signatures: readonly CommandSignature[];

    public constructor(options: CommandOptions<TContext>, noHelp = false) {
        super(options, {
            get debugView() {
                return handler.debugView;
            },
            execute: async (context) => {
                return this.checkContext(context)
                    ? await handler.execute(context)
                    : await this.handleInvalidContext(context);
            }
        });

        const definitions: ReadonlyArray<CommandDefinition<TContext>> = noHelp ? options.definitions : [
            {
                parameters: 'help {subcommand?}',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                execute: (context, [subcommand]) => this.showHelp(context, this, subcommand),
                description: 'Gets the help message for this command'
            },
            ...options.definitions
        ];

        const signatures = this.signatures = compileSignatures(definitions);

        const handler = compileHandler(signatures, this);
    }

    public abstract checkContext(context: CommandContext): context is TContext;
    protected abstract handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult;

    protected async showHelp(context: CommandContext, command: BaseCommand, subcommand?: string): Promise<SendPayload> {
        const { HelpCommand: helpCommandClass } = await helpCommandPromise;
        const help = context.cluster.commands.get('help', helpCommandClass);
        return await help?.viewDefaultCommand(context, command, subcommand) ?? this.error('Unable to load help, please try again later');
    }
}
