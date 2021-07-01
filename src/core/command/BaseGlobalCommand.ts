import { CommandContext } from './CommandContext';
import { CommandResult } from './types';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BaseGlobalCommand extends ScopedCommandBase<CommandContext> {
    public checkContext(context: CommandContext): context is CommandContext {
        return context !== undefined;
    }

    protected handleInvalidContext(context: CommandContext): Promise<CommandResult> | CommandResult {
        this.logger.error('Global commands should accept all contexts, but', context, 'was rejected');
        throw new Error('Unsuported context');
    }
}