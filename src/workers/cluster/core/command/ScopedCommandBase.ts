import { CommandContext, BaseCommand } from '../command';
import { SendPayload } from '../globalCore';
import { CommandOptions, CommandResult } from '../types';
import { compileHandler } from './compileHandler';

export abstract class ScopedCommandBase<TContext extends CommandContext> extends BaseCommand {
    public constructor(options: CommandOptions<TContext>) {
        const handler = compileHandler({
            ...options.definition,
            subcommands: {
                'help': {
                    parameters: '{subcommand?}',
                    execute: (context, [subcommand]) => showHelp(context, this, subcommand),
                    description: 'Gets the help message for this command'
                },
                ...('subcommands' in options.definition ? options.definition.subcommands : {})
            }
        }, options.flags ?? []);

        super(options, {
            signatures: handler.signatures,
            execute: async (context) => {
                return this.checkContext(context)
                    ? await handler.execute(context)
                    : await this.handleInvalidContext(context);
            }
        });
    }

    public abstract checkContext(context: CommandContext): context is TContext;
    protected abstract handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult;
}

// Circular reference means this needs to be resolved asyncronously;
const helpCommandPromise = import('../../dcommands/help');
async function showHelp(context: CommandContext, command: BaseCommand, subcommand?: string): Promise<SendPayload> {
    const { HelpCommand } = await helpCommandPromise;
    const help = context.cluster.commands.get('help', HelpCommand);
    return await help?.viewDefaultCommand(context, command, subcommand) ?? '❌ Unable to load help, please try again later';
}