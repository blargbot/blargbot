import { Dump, DumpsTable } from '@blargbot/core/types';
import { Logger } from '@blargbot/logger';
import { Client as Cassandra } from 'cassandra-driver';
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
