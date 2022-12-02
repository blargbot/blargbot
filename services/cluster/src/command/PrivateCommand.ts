import { CommandResult, PrivateCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/cluster/utils/index.js';

import templates from '../text.js';
import { CommandContext } from './CommandContext.js';
import { ScopedCommand } from './ScopedCommand.js';

export abstract class PrivateCommand extends ScopedCommand<PrivateCommandContext> {
    public guardContext(context: CommandContext): context is PrivateCommandContext {
        return guard.isPrivateCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Awaitable<CommandResult> {
        return templates.commands.$errors.privateOnly(context);
    }
}
