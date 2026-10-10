import type { CommandContext, PrivateCommandContext } from '@blargbot/cluster';
import { guard } from '@blargbot/core';
import type * as eris from 'eris';

export function isPrivateCommandContext<T extends eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & eris.PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
