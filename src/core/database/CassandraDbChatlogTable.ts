import { Logger } from '@core/Logger';
import { metrics } from '@core/Metrics';
import { Chatlog, ChatlogMessage, ChatlogSearchOptions, ChatlogsTable, ChatlogType, TypeMappingResult } from '@core/types';
import { mapping, snowflake } from '@core/utils';
import { Client as Cassandra } from 'cassandra-driver';
import { Duration } from 'moment-timezone';

export class CassandraDbChatlogTable implements ChatlogsTable {
    public constructor(
        protected readonly cassandra: Cassandra,
        protected readonly logger: Logger
    ) {

    }

    public async findAll(options: ChatlogSearchOptions): Promise<Chatlog[]> {
        const chatlogs = await this.cassandra.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid',
            { channelid: options.channelId },
            { prepare: true, readTimeout: 200000 });

        const typeLookup = new Set(options.types);
        const userLookup = new Set(options.users);
        const excludeLookup = new Set(options.exclude);
        const result = [];
        for (const row of chatlogs.rows) {
            const chatlog = mapChatlog(row);
            if (!chatlog.valid) continue;
            if (typeLookup.size > 0 && !typeLookup.has(chatlog.value.type)) continue;
            if (userLookup.size > 0 && !userLookup.has(chatlog.value.userid)) continue;
            if (excludeLookup.has(chatlog.value.msgid)) continue;
            result.push(chatlog.value);
            if (result.length >= options.count)
                break;
        }
        return result;
    }

    public async getAll(channelId: string, ids: string[]): Promise<Chatlog[]> {
        const chatlogs = await this.cassandra.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid ' +
            'AND id IN :ids',
            { channelid: channelId, ids: ids },
            { prepare: true, readTimeout: 200000 });

        return chatlogs.rows.map(mapChatlog)
            .filter((c): c is Extract<TypeMappingResult<Chatlog>, { valid: true; }> => c.valid)
            .map(c => c.value);
    }

    public async getByMessageId(messageId: string): Promise<Chatlog | undefined> {
        const map = await this.cassandra.execute(
            'SELECT channelid, id ' +
            'FROM chatlogs_map ' +
            'WHERE msgid = :id ' +
            'LIMIT 1',
            { id: messageId },
            { prepare: true });
        if (map.rows.length === 0)
            return undefined;
        const messages = await this.cassandra.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid and id = :id ' +
            'LIMIT 1',
            map.rows[0],
            { prepare: true });
        if (messages.rows.length === 0)
            return undefined;
        const mapped = mapChatlog(messages.rows[0]);
        return mapped.valid ? mapped.value : undefined;
    }

    public async add(message: ChatlogMessage, type: ChatlogType, lifespanS: number | Duration = 604800): Promise<void> {
        metrics.chatlogCounter.labels(stringifyType(type)).inc();
        const lifespan = typeof lifespanS === 'number' ? lifespanS : lifespanS.asSeconds();
        const chatlog: Chatlog = {
            ...message,
            id: snowflake.create().toString(),
            msgtime: new Date(),
            type: type
        };
        await this.cassandra.execute(
            'INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)\n' +
            'VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)\n' +
            `USING TTL ${lifespan}`,
            chatlog,
            { prepare: true });
        await this.cassandra.execute(
            'INSERT INTO chatlogs_map (id, msgid, channelid)\n' +
            'VALUES (:id, :msgid, :channelid)\n' +
            `USING TTL ${lifespan}`,
            { id: chatlog.id, msgid: chatlog.msgid, channelid: chatlog.channelid },
            { prepare: true });
    }

    public async migrate(): Promise<void> {
        try {
            await this.cassandra.execute(
                'CREATE TABLE IF NOT EXISTS chatlogs (\n' +
                '    id BIGINT,\n' +
                '    channelid BIGINT,\n' +
                '    guildid BIGINT,\n' +
                '    msgid BIGINT,\n' +
                '    userid BIGINT,\n' +
                '    content TEXT,\n' +
                '    msgtime TIMESTAMP,\n' +
                '    embeds TEXT,\n' +
                '    type INT,\n' +
                '    attachment TEXT,\n' +
                '    PRIMARY KEY ((channelid), id)\n' +
                ')\n' +
                'WITH CLUSTERING ORDER BY(id DESC);');

            await this.cassandra.execute(
                'CREATE TABLE IF NOT EXISTS chatlogs_map (\n' +
                '    id BIGINT,\n' +
                '    msgid BIGINT,\n' +
                '    channelid BIGINT,\n' +
                '    PRIMARY KEY((msgid), id)\n' +
                ')\n' +
                'WITH CLUSTERING ORDER BY(id DESC);');
        } catch (err: unknown) {
            this.logger.error(err);
        }
    }
}

const mapChatlog = mapping.mapObject<Chatlog>({
    attachment: mapping.mapOptionalString,
    channelid: mapping.mapString,
    content: mapping.mapString,
    embeds: mapping.mapJson(mapping.mapArray(mapping.mapUnknown)),
    guildid: mapping.mapString,
    id: mapping.mapString,
    msgid: mapping.mapString,
    msgtime: mapping.mapInstanceof(Date),
    type: mapping.mapIn(ChatlogType.CREATE, ChatlogType.DELETE, ChatlogType.UPDATE),
    userid: mapping.mapString
});

function stringifyType(type: ChatlogType): string {
    switch (type) {
        case ChatlogType.CREATE: return 'create';
        case ChatlogType.UPDATE: return 'update';
        case ChatlogType.DELETE: return 'delete';
    }
}
