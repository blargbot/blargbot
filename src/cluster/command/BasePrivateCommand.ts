import { CommandResult, PrivateCommandContext } from '@cluster/types';
import { guard } from '@cluster/utils';

import { CommandContext } from './CommandContext';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BasePrivateCommand extends ScopedCommandBase<PrivateCommandContext> {
    public guardContext(context: CommandContext): context is PrivateCommandContext {
        return guard.isPrivateCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return this.error(` \`${context.prefix}${context.commandName}\` can only be used in private messages.`);
    }
}
