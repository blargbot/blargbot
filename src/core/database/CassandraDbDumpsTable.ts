import { Dump, DumpsTable } from '@blargbot/core/types';
import { Logger } from '@blargbot/logger';
import { mapping } from '@blargbot/mapping';
import { Client as Cassandra } from 'cassandra-driver';
import { EmbedOptions } from 'eris';
import Long from 'long';

export class CassandraDbDumpsTable implements DumpsTable {
    public constructor(
        protected readonly cassandra: Cassandra,
        protected readonly logger: Logger
    ) {
    }

    public async add(dump: Dump): Promise<void> {
        await this.cassandra.execute(
            'INSERT INTO message_outputs (id, content, embeds, channelid)\n' +
            'VALUES (:id, :content, :embeds, :channelid)\n' +
            `USING TTL ${dump.expiry}`,
            {
                id: dump.id,
                channelid: dump.channelid,
                content: dump.content,
                embeds: dump.embeds === undefined ? undefined : JSON.stringify(dump.embeds)
            },
            { prepare: true });
    }

    public async get(id: string): Promise<Dump | undefined> {
        const dump = await this.cassandra.execute('SELECT id, content, embeds, channelid, TTL(content) as expiry FROM message_outputs WHERE id = :id', { id }, { prepare: true });
        const mapped = mapDump(dump.rows[0]);
        return mapped.valid ? mapped.value : undefined;
    }

    public async migrate(): Promise<void> {
        try {
            await this.cassandra.execute(
                'CREATE TABLE IF NOT EXISTS message_outputs (\n' +
                '    id BIGINT PRIMARY KEY,\n' +
                '    content TEXT,\n' +
                '    embeds TEXT,\n' +
                '    channelid BIGINT,\n' +
                ')');
        } catch (err: unknown) {
            this.logger.error(err);
        }
    }
}

const mapLongToString = mapping.instanceof(Long).map(v => v.toString());
const mapDump = mapping.object<Dump>({
    id: mapLongToString,
    channelid: mapLongToString,
    content: mapping.string.nullish.map(v => v ?? undefined),
    embeds: mapping.json(mapping.array(v => mapping.fake<EmbedOptions>(v))).nullish.map(v => v ?? undefined),
    expiry: mapping.number
});
