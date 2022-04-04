import { Dump, DumpsTable, ParsedDump } from '@blargbot/core/types';
import { Logger } from '@blargbot/logger';
import { mapping } from '@blargbot/mapping';
import { Client as Cassandra } from 'cassandra-driver';
import Long from 'long';
import { Duration } from 'moment-timezone';

export class CassandraDbDumpsTable implements DumpsTable {
    public constructor(
        protected readonly cassandra: Cassandra,
        protected readonly logger: Logger
    ) {
    }

    public async add(dump: Dump, lifespanS: number | Duration = 604800): Promise<void> {
        const lifespan = typeof lifespanS === 'number' ? lifespanS : lifespanS.asSeconds();
        await this.cassandra.execute(
            'INSERT INTO message_outputs (id, content, embeds, channelid)\n' +
            'VALUES (:id, :content, :embeds, :channelid)\n' +
            `USING TTL ${lifespan}`,
            dump,
            { prepare: true });
    }

    public async getById(id: string): Promise<ParsedDump | undefined> {
        const res = await this.cassandra.execute(
            'SELECT id, content, embeds, channelid, TTL(content) as expiry ' +
            'FROM message_outputs ' +
            'WHERE id = :id ' +
            'LIMIT 1',
            { id },
            { prepare: true });

        if (res.rows.length === 0) {
            return undefined;
        }

        const dump = mapDump(res.rows[0]);

        return dump.valid ? dump.value : undefined;
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

const mapDump = mapping.object<ParsedDump>({
    id: mapLongToString,
    content: mapping.string,
    embeds: mapping.json(mapping.array(mapping.unknown)).nullish.map(v => v ?? null),
    channelid: mapLongToString.nullish.map(v => v ?? undefined),
    expiry: mapping.number
});
