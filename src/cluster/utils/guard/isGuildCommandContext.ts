import type { CommandContext } from '@blargbot/cluster/command/index.js';
import type { GuildCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type * as eris from 'eris';

export function isGuildCommandContext<T extends eris.KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & eris.KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
