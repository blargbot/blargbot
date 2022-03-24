import { CommandResult, PrivateCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';

import { CommandContext } from './CommandContext';
import { ScopedCommand } from './ScopedCommand';

export abstract class PrivateCommand extends ScopedCommand<PrivateCommandContext> {
    public guardContext(context: CommandContext): context is PrivateCommandContext {
        return guard.isPrivateCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return this.error(` \`${context.prefix}${context.commandName}\` can only be used in private messages.`);
    }
}
