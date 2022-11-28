import { CommandContext } from '../../command/index';
import { PrivateCommandContext } from '@blargbot/cluster/types';
import { guard } from '@blargbot/core/utils';
import Eris from 'eris';

export function isPrivateCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & Eris.PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
