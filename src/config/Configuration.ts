export interface Configuration {
    readonly cassandra: CassandraConfiguration;
    readonly rethink: RethinkConfiguration;
    readonly postgres: PostgresConfiguration;
    readonly general: GeneralConfiguration;
    readonly blargbotApi: ImageApiConfiguration;
    readonly sentry: SentryConfiguration;
    readonly airtable: AirtableConfiguration;
    readonly website: WebsiteConfiguration;
    readonly api: ApiWorkerConfiguration;
    readonly discord: DiscordConfiguration;
}

export interface RethinkConfiguration {
    readonly host: string;
    readonly port: number;
    readonly db: string;
    readonly user: string;
    readonly password: string;
}

export interface SequelizeConfiguration {
    readonly host?: string;
    readonly pool: {
        readonly max: number;
        readonly min: number;
        readonly acquire: number;
        readonly idle: number;
    };
}

export interface DiscordConfiguration {
    readonly defaultPrefix: string;
    readonly token: string;
    readonly shards: ClusterWorkerConfiguration;
    readonly images: ImageWorkerConfiguration;
    readonly guilds: GuildsConfiguration;
    readonly channels: ChannelsConfiguration;
    readonly users: UsersConfiguration;
    readonly roles: RolesConfiguration;
    readonly emotes: EmotesConfiguration;
}

export interface EmotesConfiguration {
    readonly beemovie: string;
    readonly online: string;
    readonly away: string;
    readonly busy: string;
    readonly offline: string;
}

export interface RolesConfiguration {
    readonly updates: string;
    readonly staff: string;
    readonly support: string;
}

export interface UsersConfiguration {
    readonly developers: readonly string[];
}

export interface ChannelsConfiguration {
    readonly botlog: string;
    readonly taglog: string;
    readonly shardlog: string;
    readonly changelog: string;
    readonly joinlog: string;
    readonly errorlog: string;
    readonly autoresponse: string;
    readonly feedback: string;
    readonly suggestions: string;
    readonly bugreports: string;
    readonly tagreports: string;
}

export interface GuildsConfiguration {
    readonly home: string;
}

export interface ImageWorkerConfiguration {
    readonly perCluster: number;
    readonly spawnTime: number;
}

export interface ClusterWorkerConfiguration {
    readonly max: number;
    readonly perCluster: number;
    readonly spawnTime: number;
}

export interface ApiWorkerConfiguration {
    readonly host: string;
    readonly port: number;
}

export interface WebsiteConfiguration {
    readonly host: string;
    readonly secure: boolean;
    readonly port: number;
    readonly sessionExpiry: number;
    readonly sessionSecret: string;
    readonly clientId: string;
    readonly secret: string;
    readonly callback: string;

}

export interface AirtableConfiguration {
    readonly base: string;
    readonly key: string;
}

export interface SentryConfiguration {
    readonly base: string;
    readonly sampleRate: number;
}

export interface ImageApiConfiguration {
    readonly base: string;
    readonly token: string;
}

export interface GeneralConfiguration {
    readonly carbontoken: string;
    readonly botlisttoken: string;
    readonly botlistorgtoken: string;
    readonly cleverbotApi: string;
    readonly shrinkwrapKey: string;
    readonly wolke: string;
    readonly mashape: string;
    readonly isProd?: boolean;
    readonly loglevel: string;
}

export interface PostgresConfiguration {
    readonly host?: string;
    readonly user: string;
    readonly pass: string;
    readonly database: string;
    readonly port?: number;
    readonly sequelize: SequelizeConfiguration;
}

export interface CassandraConfiguration {
    readonly contactPoints: readonly string[];
    readonly keyspace: string;
    readonly username: string;
    readonly password: string;
}
