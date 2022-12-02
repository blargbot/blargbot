import { PrivateCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { CommandContext } from '../../command/index.js';

export function isPrivateCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & Eris.PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
