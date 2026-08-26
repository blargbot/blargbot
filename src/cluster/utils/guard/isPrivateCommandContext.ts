import type { CommandContext } from '@blargbot/cluster/command/index.js';
import type { PrivateCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type * as eris from 'eris';

export function isPrivateCommandContext<T extends eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & eris.PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
