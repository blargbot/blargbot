import { AirtableConfiguration, CassandraConfiguration, PostgresConfiguration, RethinkConfiguration } from '@blargbot/config';
import { Logger } from '@blargbot/logger';

export interface DatabaseOptions {
    readonly logger: Logger;
    readonly rethink: RethinkConfiguration;
    readonly cassandra: CassandraConfiguration;
    readonly postgres: PostgresConfiguration;
    readonly airtable: AirtableConfiguration;
    readonly shouldCacheUser: (userId: string) => boolean;
    readonly shouldCacheGuild: (userId: string) => boolean;
}
