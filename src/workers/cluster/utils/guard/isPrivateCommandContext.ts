import { CommandContext } from '@cluster/command';
import { PrivateCommandContext } from '@cluster/types';
import { guard } from '@core/utils';
import { Channel, PrivateChannel } from 'eris';

export function isPrivateCommandContext<T extends Channel>(context: CommandContext<T>): context is PrivateCommandContext<T & PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
