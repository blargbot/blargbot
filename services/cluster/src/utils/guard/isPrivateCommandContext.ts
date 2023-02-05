import type { PrivateCommandContext } from '@blargbot/cluster/types.js';
import { isPrivateChannel } from '@blargbot/discord-util';
import type * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';

export function isPrivateCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & Eris.PrivateChannel> {
    return isPrivateChannel(context.channel);
}
