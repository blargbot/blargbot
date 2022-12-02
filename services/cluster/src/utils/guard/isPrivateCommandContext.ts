import { CommandContext } from '../../command/index.js';
import { PrivateCommandContext } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import Eris from 'eris';

export function isPrivateCommandContext<T extends Eris.KnownTextableChannel>(context: CommandContext<T>): context is PrivateCommandContext<T & Eris.PrivateChannel> {
    return guard.isPrivateChannel(context.channel);
}
