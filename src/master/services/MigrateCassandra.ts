import { BaseService } from '../../structures/BaseService';
import { Master } from '../Master';

export class MigrateCassandra extends BaseService {
    public readonly type = 'database';

    public constructor(
        public readonly master: Master
    ) {
        super();
    }

    public async start(): Promise<void> {
        try {
            await this.master.cassandra.execute(`
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

            await this.master.cassandra.execute(`
CREATE TABLE IF NOT EXISTS chatlogs_map (
    id BIGINT,
    msgid BIGINT,
    channelid BIGINT,
    PRIMARY KEY ((msgid), id)
) WITH CLUSTERING ORDER BY (id DESC);`);

            await this.master.cassandra.execute(`
CREATE TABLE IF NOT EXISTS message_outputs (
    id BIGINT PRIMARY KEY,
    content TEXT,
    embeds TEXT,
    channelid BIGINT,
)`);
        } catch (err) {
            this.master.logger.error(err.message, err.stack);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public stop(): void { }
}