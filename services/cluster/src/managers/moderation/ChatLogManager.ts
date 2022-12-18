import type { ChatLog, ChatLogIndex, ChatLogSearchOptions } from '@blargbot/chatlog-types';
import type { Cluster } from '@blargbot/cluster';
import { guard, snowflake } from '@blargbot/cluster/utils/index.js';

export class ChatLogManager {
    public constructor(
        protected readonly cluster: Cluster
    ) {

    }

    public async find(options: ChatLogSearchOptions): Promise<readonly ChatLog[]> {
        return await this.cluster.database.chatlogs.findAll(options);
    }

    public async createIndex(options: ChatLogSearchOptions): Promise<ChatLogIndex<ChatLog>> {
        const chatlogs = await this.cluster.database.chatlogs.findAll(options);
        const key = snowflake.create().toString();

        const channel = await this.cluster.util.getChannel(options.channelId);

        let channelName = '';
        let guildName = '';
        if (channel !== undefined && guard.isGuildChannel(channel)) {
            channelName = channel.name;
            guildName = channel.guild.name;
        }

        const result: ChatLogIndex = {
            keycode: key,
            channel: options.channelId,
            channelName,
            guildName,
            ids: chatlogs.map(l => l.id.toString()),
            limit: options.count,
            types: options.types,
            users: options.users
        };
        await this.cluster.database.chatlogIndex.add(result);
        return { ...result, ids: chatlogs };
    }

    public async getIndex(id: string): Promise<ChatLogIndex<ChatLog> | undefined> {
        const index = await this.cluster.database.chatlogIndex.get(id);
        if (index === undefined)
            return undefined;

        const chatlogs = await this.cluster.database.chatlogs.getAll(index.channel, index.ids);
        return { ...index, ids: chatlogs };
    }
}
