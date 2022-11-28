import { CommandContext } from '../../command/index';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/core/utils';
import { KnownGuildTextableChannel, KnownTextableChannel } from 'eris';

export function isGuildCommandContext<T extends KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
