import { CommandContext } from '../../command/index';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/core/utils';
import Eris from 'eris';

export function isGuildCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & Eris.KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
