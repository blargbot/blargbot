import { CommandContext } from '@cluster/command';
import { PrivateCommandContext } from '@cluster/types';
import { guard } from '@core/utils';
import { KnownTextableChannel, PrivateChannel } from 'eris';

export function isPrivateCommandContext<T extends KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
