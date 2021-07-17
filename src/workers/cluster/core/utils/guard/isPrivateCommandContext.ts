import { Channel, PrivateChannel } from 'eris';
import { guard } from '@core';
import { CommandContext } from '../../command';
import { PrivateCommandContext } from '../../types';

export function isPrivateCommandContext<T extends Channel>(context: CommandContext<T>): context is PrivateCommandContext<T & PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
