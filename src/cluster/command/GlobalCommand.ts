import { CommandContext } from './CommandContext.js';
import { ScopedCommand } from './ScopedCommand.js';

export abstract class GlobalCommand extends ScopedCommand<CommandContext> {
    public guardContext(context: CommandContext): context is CommandContext {
        return context instanceof CommandContext;
    }

    protected handleInvalidContext(): never {
        throw new Error('Unsuported context');
    }
}
