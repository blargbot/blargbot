import { CommandContext, PrivateCommandContext } from './CommandContext';
import { guard } from '../../utils';
import { CommandResult } from './types';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BasePrivateCommand extends ScopedCommandBase<PrivateCommandContext> {
    public checkContext(context: CommandContext): context is PrivateCommandContext {
        return guard.isPrivateCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return `❌ \`${context.prefix}${context.commandName}\` can only be used in private messages.`;
    }
}
