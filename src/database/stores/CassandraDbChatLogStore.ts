import { metrics } from '@blargbot/core/Metrics';
import { snowflake } from '@blargbot/core/utils';
import { ChatLog, ChatLogMessage, ChatLogSearchOptions, ChatLogType } from '@blargbot/domain/models';
import { ChatLogStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import { mapping } from '@blargbot/mapping';
import { Client as Cassandra } from 'cassandra-driver';
import Long from 'long';
import { Duration } from 'moment-timezone';

export class CassandraDbChatLogStore implements ChatLogStore {
    readonly #db: Cassandra;
    readonly #logger: Logger;

    public constructor(
        cassandra: Cassandra,
        logger: Logger
    ) {
        this.#db = cassandra;
        this.#logger = logger;
    }

    public async findAll(options: ChatLogSearchOptions): Promise<ChatLog[]> {
        const chatlogs = await this.#db.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid',
            { channelid: options.channelId },
            { prepare: true, readTimeout: 200000 });

        const typeLookup = new Set(options.types);
        const userLookup = new Set(options.users);
        const excludeLookup = new Set(options.exclude);
        const result = [];
        for (const row of chatlogs.rows) {
            const chatlog = mapChatLog(row);
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

    public async getAll(channelId: string, ids: string[]): Promise<ChatLog[]> {
        const batches = ids.reduce<string[][]>((b, c, i) => {
            if (i % 100 === 0)
                b.push([]);
            b[b.length - 1].push(c);
            return b;
        }, []);

        const chatlogs = await Promise.all(batches.map(ids => this.#db.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid ' +
            'AND id IN :ids',
            { channelid: channelId, ids: ids },
            { prepare: true, readTimeout: 200000 })
        ));

        return chatlogs.flatMap(c => c.rows)
            .map(mapChatLog)
            .filter((c): c is Extract<typeof c, { valid: true; }> => c.valid)
            .map(c => c.value);
    }

    public async getByMessageId(messageId: string): Promise<ChatLog | undefined> {
        const map = await this.#db.execute(
            'SELECT channelid, id ' +
            'FROM chatlogs_map ' +
            'WHERE msgid = :id ' +
            'LIMIT 1',
            { id: messageId },
            { prepare: true });
        if (map.rows.length === 0)
            return undefined;
        const messages = await this.#db.execute(
            'SELECT * FROM chatlogs ' +
            'WHERE channelid = :channelid and id = :id ' +
            'LIMIT 1',
            map.rows[0],
            { prepare: true });
        if (messages.rows.length === 0)
            return undefined;
        const mapped = mapChatLog(messages.rows[0]);
        return mapped.valid ? mapped.value : undefined;
    }

    public async add(message: ChatLogMessage, type: ChatLogType, lifespanS: number | Duration = 604800): Promise<void> {
        metrics.chatlogCounter.labels(stringifyType(type)).inc();
        const lifespan = typeof lifespanS === 'number' ? lifespanS : lifespanS.asSeconds();
        const chatlog = {
            ...message,
            id: snowflake.create().toString(),
            msgtime: new Date(),
            type: type,
            embeds: JSON.stringify(message.embeds),
            attachment: JSON.stringify(message.attachments)
        };
        await this.#db.execute(
            'INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)\n' +
            'VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)\n' +
            `USING TTL ${lifespan}`,
            chatlog,
            { prepare: true });
        await this.#db.execute(
            'INSERT INTO chatlogs_map (id, msgid, channelid)\n' +
            'VALUES (:id, :msgid, :channelid)\n' +
            `USING TTL ${lifespan}`,
            { id: chatlog.id, msgid: chatlog.msgid, channelid: chatlog.channelid },
            { prepare: true });
    }

    public async migrate(): Promise<void> {
        try {
            await this.#db.execute(
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

            await this.#db.execute(
                'CREATE TABLE IF NOT EXISTS chatlogs_map (\n' +
                '    id BIGINT,\n' +
                '    msgid BIGINT,\n' +
                '    channelid BIGINT,\n' +
                '    PRIMARY KEY((msgid), id)\n' +
                ')\n' +
                'WITH CLUSTERING ORDER BY(id DESC);');
        } catch (err: unknown) {
            this.#logger.error(err);
        }
    }
}

const mapLongToString = mapping.instanceof(Long).map(v => v.toString());

const mapChatLog = mapping.object<ChatLog>({
    attachments: ['attachment', mapping.choice(
        mapping.json(mapping.array(mapping.string)),
        mapping.string.nullish.map(s => typeof s === 'string' ? [s] : [])
    )],
    channelid: mapLongToString,
    content: mapping.string,
    embeds: mapping.json(mapping.array(mapping.typeof('object'))),
    guildid: mapLongToString,
    id: mapLongToString,
    msgid: mapLongToString,
    msgtime: mapping.instanceof(Date),
    type: mapping.in(ChatLogType.CREATE, ChatLogType.DELETE, ChatLogType.UPDATE),
    userid: mapLongToString
});

function stringifyType(type: ChatLogType): string {
    switch (type) {
        case ChatLogType.CREATE: return 'create';
        case ChatLogType.UPDATE: return 'update';
        case ChatLogType.DELETE: return 'delete';
    }
}
