import { mapping } from '@blargbot/mapping';
import type { MessageDump } from '@blargbot/message-dumps-client';
import cassandra from 'cassandra-driver';

export default class MessageDumpDatabase {
    readonly #database: cassandra.Client;

    public constructor(options: MessageDumpDatabaseOptions) {
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

    public async add(message: MessageDump): Promise<void> {
        const lifespan = message.expiry.valueOf() - Date.now();
        await this.#database.execute(insertMessageDumpQuery(lifespan), {
            id: message.id.toString(),
            content: message.content,
            embeds: JSON.stringify(message.embeds),
            channelId: message.channelId.toString()
        }, { prepare: true });
    }

    public async get(id: bigint): Promise<MessageDump | undefined> {
        const dump = await this.#database.execute(getMessageDumpQuery(), { id: id.toString() }, { prepare: true });
        const mapped = mapDump(dump.rows[0]);
        return mapped.valid ? mapped.value : undefined;
    }

    async #assertDb(): Promise<void> {
        console.log('Asserting CQL schema');
        await Promise.all([
            this.#database.execute(createMessageDumpsTableQuery())
        ]);
    }
}

const mapCQLBigIntToJs = mapping.choice(
    mapping.instanceof(cassandra.types.Long).map(x => BigInt(x.toString())),
    mapping.number.map(BigInt),
    mapping.bigInt
);
const mapDump = mapping.object<MessageDump>({
    id: mapCQLBigIntToJs,
    channelId: ['channelid', mapCQLBigIntToJs],
    content: mapping.string.nullish.map(v => v ?? undefined),
    embeds: mapping.json(mapping.array(mapping.typeof('object'))).nullish.map(v => v ?? undefined),
    expiry: mapping.number.map(ttl => new Date(Date.now() + ttl))
});

export interface MessageDumpDatabaseOptions {
    readonly contactPoints: Iterable<string>;
    readonly keyspace: string;
    readonly username: string;
    readonly password: string;
}

const createMessageDumpsTableQuery = (): string => `
CREATE TABLE IF NOT EXISTS message_outputs (
    id BIGINT PRIMARY KEY,
    content TEXT,
    embeds TEXT,
    channelid BIGINT
)`;

const insertMessageDumpQuery = (ttl: number): string => `
INSERT INTO message_outputs (id, content, embeds, channelid)
VALUES (:id, :content, :embeds, :channelId)
USING TTL ${ttl}`;

const getMessageDumpQuery = (): string => `
SELECT id, content, embeds, channelid, TTL(channelid) as expiry
FROM message_outputs
WHERE id = :id`;
