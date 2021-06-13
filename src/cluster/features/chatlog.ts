import { AnyMessage } from 'eris';
import { ChatlogType } from '../../core/database';
import { guard } from '../../utils';
import { Cluster } from '../Cluster';

export async function addChatlog(cluster: Cluster, message: AnyMessage): Promise<void> {
    if (guard.isGuildMessage(message) && await cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs'))
        await cluster.database.chatlogs.add(message, ChatlogType.CREATE);
}