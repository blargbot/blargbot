import { CommandResult, GuildCommandContext } from '@cluster/types';
import { guard } from '@cluster/utils';

import { CommandContext } from './CommandContext';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BaseGuildCommand extends ScopedCommandBase<GuildCommandContext> {
    public guardContext(context: CommandContext): context is GuildCommandContext {
        return guard.isGuildCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return this.error(`\`${context.prefix}${context.commandName}\` can only be used on guilds.`);
    }
}
