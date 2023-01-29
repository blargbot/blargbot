import { randomInt } from 'node:crypto';

import type { ChatLog, ChatLogMessage } from '@blargbot/chatlog-types';
import { ChatLogType } from '@blargbot/chatlog-types';
import { mapping } from '@blargbot/mapping';
import cassandra from 'cassandra-driver';

export default class DiscordChatlogDatabase {
    readonly #database: cassandra.Client;

    public constructor(options: DiscordChatlogDatabaseOptions) {
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
        const chatlog: ChatLogRecord = {
            ...message,
            id: randomInt(maxInt).toString(),
            msgtime: new Date(),
            type: type,
            embeds: JSON.stringify(message.embeds),
            attachment: JSON.stringify(message.attachments)
        };
        await this.#database.execute(insertChatlogQuery(lifespan), chatlog, { prepare: true });
        await this.#database.execute(insertChatlogMapQuery(lifespan), chatlog, { prepare: true });
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
                getChatlogQuery(),
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
            this.#database.execute(createChatlogsTableQuery()),
            this.#database.execute(createChatlogsMapTableQuery())
        ]);
    }
}

const maxInt = Math.pow(2, 48) - 1;
const mapLongToString = mapping.instanceof(cassandra.types.Long).map(v => v.toString());
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

export interface DiscordChatlogDatabaseOptions {
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

const createChatlogsTableQuery = (): string => `
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

const createChatlogsMapTableQuery = (): string => `
CREATE TABLE IF NOT EXISTS chatlogs_map (
    id BIGINT,
    msgid BIGINT,
    channelid BIGINT,
    PRIMARY KEY((msgid), id)
)
WITH CLUSTERING ORDER BY(id DESC);`;

const insertChatlogQuery = (ttl: number): string => `
INSERT INTO chatlogs ( id,  content,  attachment,  userid,  msgid,  channelid,  guildid,  msgtime,  type,  embeds)
VALUES               (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
USING TTL ${ttl}`;

const insertChatlogMapQuery = (ttl: number): string => `
INSERT INTO chatlogs_map ( id,  msgid,  channelid)
VALUES                   (:id, :msgid, :channelid)
USING TTL ${ttl}`;

const getChatlogQuery = (): string => `
SELECT * FROM chatlogs 
WHERE channelid = :channelid 
AND id IN :ids`;
