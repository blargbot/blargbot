import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/cluster/utils';

import templates from '../text';
import { CommandContext } from './CommandContext';
import { ScopedCommand } from './ScopedCommand';

export abstract class GuildCommand extends ScopedCommand<GuildCommandContext> {
    public guardContext(context: CommandContext): context is GuildCommandContext {
        return guard.isGuildCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Awaitable<CommandResult> {
        return templates.commands.$errors.guildOnly(context);
    }
}
