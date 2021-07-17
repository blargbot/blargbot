import { CommandResult, PrivateCommandContext } from '../types';
import { guard } from '@cluster/core';
import { CommandContext } from './CommandContext';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BasePrivateCommand extends ScopedCommandBase<PrivateCommandContext> {
    public checkContext(context: CommandContext): context is PrivateCommandContext {
        return guard.isPrivateCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return this.error(` \`${context.prefix}${context.commandName}\` can only be used in private messages.`);
    }
}
