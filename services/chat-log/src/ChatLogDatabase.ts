import { randomInt } from 'node:crypto';

import type { ChatLog, ChatLogMessage } from '@blargbot/chat-log-client';
import { ChatLogType } from '@blargbot/chat-log-client';
import { mapping } from '@blargbot/mapping';
import cassandra from 'cassandra-driver';

export default class ChatLogDatabase {
    readonly #database: cassandra.Client;

    public constructor(options: ChatLogDatabaseOptions) {
        this.#database = new cassandra.Client({
            localDataCenter: 'datacenter1',
            contactPoints: [...options.contactPoints],
            keyspace: options.keyspace,
            authProvider: new cassandra.auth.PlainTextAuthProvider(
                options.username,
                options.password
            )
        });
    }

    public async connect(): Promise<void> {
        console.log('Connecting to CQL database');
        await this.#database.connect();
        console.log('CQL database connected');
        await this.#assertDb();
    }

    public async disconnect(): Promise<void> {
        console.log('Disconnecting from CQL database');
        await this.#database.shutdown();
        console.log('CQL database disconnected');
    }

    public async add(message: ChatLogMessage, type: ChatLogType, lifespanS: number | moment.Duration = 604800): Promise<void> {
        const lifespan = typeof lifespanS === 'number' ? lifespanS : lifespanS.asSeconds();
        const chatLog: ChatLogRecord = {
            ...message,
            id: randomInt(maxInt).toString(),
            msgtime: new Date(),
            type: type,
            embeds: JSON.stringify(message.embeds),
            attachment: JSON.stringify(message.attachments)
        };
        await this.#database.execute(insertChatLogQuery(lifespan), chatLog, { prepare: true });
        await this.#database.execute(insertChatLogMapQuery(lifespan), chatLog, { prepare: true });
    }

    public async get(messageIds: string[], channelId: string): Promise<ChatLog[]> {
        const idBatches = messageIds.reduce<string[][]>((b, c, i) => {
            if (i % 100 === 0)
                b.push([]);
            b[b.length - 1].push(c);
            return b;
        }, []);

        return await idBatches.reduce(async (resultPromise, idBatch) => {
            const resultSet = await this.#database.execute(
                getChatLogQuery(),
                { channelid: channelId, ids: idBatch },
                { prepare: true, readTimeout: 200000 });

            const results = await resultPromise;
            for await (const row of resultSet) {
                const mappedRow = mapChatLog(row);
                if (mappedRow.valid)
                    results.push(mappedRow.value);
            }
            return results;
        }, Promise.resolve<ChatLog[]>([]));
    }

    async #assertDb(): Promise<void> {
        console.log('Asserting CQL schema');
        await Promise.all([
            this.#database.execute(createChatLogsTableQuery()),
            this.#database.execute(createChatLogsMapTableQuery())
        ]);
    }
}

const maxInt = Math.pow(2, 48) - 1;
const mapCQLBigIntToJs = mapping.choice(
    mapping.instanceof(cassandra.types.Long),
    mapping.number,
    mapping.bigInt
).map(x => x.toString());
const mapChatLog = mapping.object<ChatLog>({
    attachments: ['attachment', mapping.choice(
        mapping.json(mapping.array(mapping.string)),
        mapping.string.nullish.map(s => typeof s === 'string' ? [s] : [])
    )],
    channelid: mapCQLBigIntToJs,
    content: mapping.string,
    embeds: mapping.json(mapping.array(mapping.typeof('object'))),
    guildid: mapCQLBigIntToJs,
    id: mapCQLBigIntToJs,
    msgid: mapCQLBigIntToJs,
    msgtime: mapping.instanceof(Date),
    type: mapping.in(ChatLogType.CREATE, ChatLogType.DELETE, ChatLogType.UPDATE),
    userid: mapCQLBigIntToJs
});

export interface ChatLogDatabaseOptions {
    readonly contactPoints: Iterable<string>;
    readonly keyspace: string;
    readonly username: string;
    readonly password: string;
}

interface ChatLogRecord {
    readonly id: string;
    readonly channelid: string;
    readonly guildid: string;
    readonly msgid: string;
    readonly userid: string;
    readonly content: string;
    readonly msgtime: Date;
    readonly embeds: string;
    readonly type: ChatLogType;
    readonly attachment: string;
}

const createChatLogsTableQuery = (): string => `
CREATE TABLE IF NOT EXISTS chatlogs (
    id BIGINT,
    channelid BIGINT,
    guildid BIGINT,
    msgid BIGINT,
    userid BIGINT,
    content TEXT,
    msgtime TIMESTAMP,
    embeds TEXT,
    type INT,
    attachment TEXT,
    PRIMARY KEY ((channelid), id)
)
WITH CLUSTERING ORDER BY(id DESC);`;

const createChatLogsMapTableQuery = (): string => `
CREATE TABLE IF NOT EXISTS chatlogs_map (
    id BIGINT,
    msgid BIGINT,
    channelid BIGINT,
    PRIMARY KEY((msgid), id)
)
WITH CLUSTERING ORDER BY(id DESC);`;

const insertChatLogQuery = (ttl: number): string => `
INSERT INTO chatlogs ( id,  content,  attachment,  userid,  msgid,  channelid,  guildid,  msgtime,  type,  embeds)
VALUES               (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
USING TTL ${ttl}`;

const insertChatLogMapQuery = (ttl: number): string => `
INSERT INTO chatlogs_map ( id,  msgid,  channelid)
VALUES                   (:id, :msgid, :channelid)
USING TTL ${ttl}`;

const getChatLogQuery = (): string => `
SELECT * FROM chatlogs 
WHERE channelid = :channelid 
AND id IN :ids`;
