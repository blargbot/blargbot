import { snowflake, zodStringToJson } from '@blargbot/core';
import type { Dump, DumpStore } from '@blargbot/domain';
import type { Logger } from '@blargbot/logger';
import type { Client as Cassandra } from 'cassandra-driver';
import { types } from 'cassandra-driver';
import z from 'zod';

export class CassandraDbDumpStore implements DumpStore {
    public constructor(
        protected readonly cassandra: Cassandra,
        protected readonly logger: Logger
    ) {
    }

    public async add(dump: Dump): Promise<void> {
        await this.cassandra.execute(
            `INSERT INTO message_outputs (id, content, embeds, channelid)\nVALUES (:id, :content, :embeds, :channelid)\nUSING TTL ${dump.expiry}`,
            {
                id: dump.id,
                channelid: dump.channelid,
                content: dump.content,
                embeds: dump.embeds === undefined ? undefined : JSON.stringify(dump.embeds)
            },
            { prepare: true });
    }

    public async get(id: string): Promise<Dump | undefined> {
        const dump = await this.cassandra.execute('SELECT id, content, embeds, channelid, TTL(channelid) as expiry FROM message_outputs WHERE id = :id', { id }, { prepare: true });
        const mapped = mapDump.safeParse(dump.rows[0]);
        return mapped.success ? mapped.data : undefined;
    }

    public async migrate(): Promise<void> {
        try {
            await this.cassandra.execute(
                'CREATE TABLE IF NOT EXISTS message_outputs (\n    id BIGINT PRIMARY KEY,\n    content TEXT,\n    embeds TEXT,\n    channelid BIGINT,\n)');
        } catch (err: unknown) {
            this.logger.error(err);
        }
    }
}

const mapLongToSnowflake = z.instanceof(types.Long).transform(v => v.toString()).refine(snowflake.test);
const mapDump = z.object({
    id: mapLongToSnowflake,
    channelid: mapLongToSnowflake,
    content: z.string().nullish().transform(v => v ?? undefined),
    embeds: zodStringToJson
        .pipe(z.custom<object>(v => typeof v === 'object').array())
        .nullish()
        .transform(v => v ?? undefined),
    expiry: z.number()
});
