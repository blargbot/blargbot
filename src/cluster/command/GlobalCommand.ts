import { CommandContext } from './CommandContext';
import { ScopedCommand } from './ScopedCommand';

export abstract class GlobalCommand extends ScopedCommand<CommandContext> {
    public guardContext(_context: CommandContext): _context is CommandContext {
        return true;
    }

    protected handleInvalidContext(): never {
        throw new Error('Unsuported context');
    }
}
