import type { GuildCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';

export function isGuildCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & Eris.KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
