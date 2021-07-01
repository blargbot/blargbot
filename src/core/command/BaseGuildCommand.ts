import { CommandContext, GuildCommandContext } from './CommandContext';
import { guard } from '../../utils';
import { CommandResult } from './types';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BaseGuildCommand extends ScopedCommandBase<GuildCommandContext> {
    public checkContext(context: CommandContext): context is GuildCommandContext {
        return guard.isGuildCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return `❌ \`${context.prefix}${context.commandName}\` can only be used on guilds.`;
    }
}
