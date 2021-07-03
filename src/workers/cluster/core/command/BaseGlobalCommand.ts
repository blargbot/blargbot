import { CommandContext } from './CommandContext';
import { ScopedCommandBase } from './ScopedCommandBase';

export abstract class BaseGlobalCommand extends ScopedCommandBase<CommandContext> {
    public checkContext(_context: CommandContext): _context is CommandContext {
        return true;
    }

    protected handleInvalidContext(): never {
        throw new Error('Unsuported context');
    }
}
