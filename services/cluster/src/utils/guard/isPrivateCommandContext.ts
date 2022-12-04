import type { PrivateCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';

export function isPrivateCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & Eris.PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
