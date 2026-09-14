import type { CommandResult, GuildCommandContext } from '@blargbot/cluster';
import { guard } from '@blargbot/cluster';

import { templates } from '../text.js';
import type { CommandContext } from './CommandContext.js';
import { ScopedCommand } from './ScopedCommand.js';

export abstract class GuildCommand extends ScopedCommand<GuildCommandContext> {
    public guardContext(context: CommandContext): context is GuildCommandContext {
        return guard.isGuildCommandContext(context);
    }

    protected handleInvalidContext(context: CommandContext): Awaitable<CommandResult> {
        return templates.commands.$errors.guildOnly(context);
    }
}
