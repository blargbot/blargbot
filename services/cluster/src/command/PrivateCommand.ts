import { CommandResult, PrivateCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';

import templates from '../text';
import { CommandContext } from './CommandContext';
import { ScopedCommand } from './ScopedCommand';

export abstract class PrivateCommand extends ScopedCommand<PrivateCommandContext> {
    public guardContext(context: CommandContext): context is PrivateCommandContext {
        return guard.isPrivateCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Awaitable<CommandResult> {
        return templates.commands.$errors.privateOnly(context);
    }
}
