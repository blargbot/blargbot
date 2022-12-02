import { CommandContext } from '../../command/index.js';
import { GuildCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import Eris from 'eris';

export function isGuildCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & Eris.KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
