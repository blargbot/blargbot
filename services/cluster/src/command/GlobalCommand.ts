import { CommandContext } from './CommandContext.js';
import { ScopedCommand } from './ScopedCommand.js';

export abstract class GlobalCommand extends ScopedCommand<CommandContext> {
    public guardContext(_context: CommandContext): _context is CommandContext {
        return true;
    }

    protected handleInvalidContext(): never {
        throw new Error('Unsuported context');
    }
}
