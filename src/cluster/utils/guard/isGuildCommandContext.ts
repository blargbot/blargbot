import { CommandContext } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { guard } from '@core/utils';
import { KnownGuildTextableChannel, KnownTextableChannel } from 'eris';

export function isGuildCommandContext<T extends KnownTextableChannel>(context: CommandContext<T>): context is GuildCommandContext<T & KnownGuildTextableChannel> {
    return guard.isGuildChannel(context.channel);
}
