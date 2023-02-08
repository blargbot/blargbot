import type { GuildCommandContext } from '@blargbot/cluster/types.js';
import { isGuildChannel } from '@blargbot/discord-util';
import type * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';

export function isGuildCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & Eris.KnownGuildTextableChannel> {
    return isGuildChannel(context.channel);
}
