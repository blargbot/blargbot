import { Client as CassandraClient } from 'cassandra-driver';

export async function migrateCassandra(client: CassandraClient, logger: CatLogger): Promise<void> {
    try {
        await client.execute(`
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
) WITH CLUSTERING ORDER BY (id DESC);`);

        await client.execute(`
CREATE TABLE IF NOT EXISTS chatlogs_map (
    id BIGINT,
    msgid BIGINT,
    channelid BIGINT,
    PRIMARY KEY ((msgid), id)
) WITH CLUSTERING ORDER BY (id DESC);`);

        await client.execute(`
CREATE TABLE IF NOT EXISTS message_outputs (
    id BIGINT PRIMARY KEY,
    content TEXT,
    embeds TEXT,
    channelid BIGINT,
)`);
    } catch (err) {
        logger.error(err.message, err.stack);
    }
}