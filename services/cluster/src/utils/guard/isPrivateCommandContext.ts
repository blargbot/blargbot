import { CommandContext } from '../../command/index';
import { PrivateCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/core/utils';
import { KnownTextableChannel, PrivateChannel } from 'eris';

export function isPrivateCommandContext<T extends KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
