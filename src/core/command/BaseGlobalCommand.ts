import { CommandContext } from './CommandContext';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BaseGlobalCommand extends ScopedCommandBase<CommandContext> {
    public checkContext(context: CommandContext): context is CommandContext {
        return context !== undefined;
    }

    protected handleInvalidContext(): never {
        throw new Error('Unsuported context');
    }
}