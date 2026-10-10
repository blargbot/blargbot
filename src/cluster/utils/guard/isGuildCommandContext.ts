import type { CommandContext, GuildCommandContext } from '@blargbot/cluster';
import { guard } from '@blargbot/core';
import type * as eris from 'eris';

export function isGuildCommandContext<T extends eris.KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & eris.KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
