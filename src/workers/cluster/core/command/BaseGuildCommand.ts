import { CommandResult, GuildCommandContext } from '../types';
import { guard } from '../utils';
import { CommandContext } from './CommandContext';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BaseGuildCommand extends ScopedCommandBase<GuildCommandContext> {
    public checkContext(context: CommandContext): context is GuildCommandContext {
        return guard.isGuildCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        return this.error(`\`${context.prefix}${context.commandName}\` can only be used on guilds.`);
    }
}
