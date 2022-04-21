import { Type } from '@blargbot/di';

export const configType = Type.interface<Configuration>({
    airtable: Type.interface<AirtableConfiguration>({
        base: Type.string,
        key: Type.string,
        public: Type.string,
        suggestions: Type.string
    }),
    api: Type.interface<ApiWorkerConfiguration>({
        host: Type.string,
        port: Type.number
    }),
    blargbotApi: Type.interface<ImageApiConfiguration>({
        base: Type.string,
        token: Type.string
    }),
    cassandra: Type.interface<CassandraConfiguration>({
        contactPoints: Type.string.readonlyArray,
        keyspace: Type.string,
        password: Type.string,
        username: Type.string
    }),
    discord: Type.interface<DiscordConfiguration>({
        channels: Type.interface<ChannelsConfiguration>({
            autoresponse: Type.string,
            botlog: Type.string,
            bugreports: Type.string,
            changelog: Type.string,
            errorlog: Type.string,
            feedback: Type.string,
            joinlog: Type.string,
            shardlog: Type.string,
            suggestions: Type.string,
            taglog: Type.string,
            tagreports: Type.string
        }),
        defaultPrefix: Type.string,
        emotes: Type.interface<EmotesConfiguration>({
            away: Type.string,
            beemovie: Type.string,
            busy: Type.string,
            offline: Type.string,
            online: Type.string
        }),
        guilds: Type.interface<GuildsConfiguration>({
            home: Type.string
        }),
        images: Type.interface<ImageWorkerConfiguration>({
            perCluster: Type.number,
            spawnTime: Type.number
        }),
        roles: Type.interface<RolesConfiguration>({
            staff: Type.string,
            support: Type.string,
            updates: Type.string
        }),
        shards: Type.interface<ClusterWorkerConfiguration>({
            concurrency: Type.number.optional,
            max: Type.number,
            perCluster: Type.number,
            spawnTime: Type.number
        }),
        token: Type.string,
        users: Type.interface<UsersConfiguration>({
            developers: Type.string.readonlyArray
        })
    }),
    general: Type.interface<GeneralConfiguration>({
        botlistorgtoken: Type.string,
        botlisttoken: Type.string,
        carbontoken: Type.string,
        cleverbotApi: Type.string,
        isProd: Type.boolean.optional,
        loglevel: Type.string,
        mashape: Type.string,
        shrinkwrapKey: Type.string,
        wolke: Type.string
    }),
    postgres: Type.interface<PostgresConfiguration>({
        database: Type.string,
        host: Type.string.optional,
        pass: Type.string,
        port: Type.number.optional,
        sequelize: Type.interface<SequelizeConfiguration>({
            host: Type.string.optional,
            pool: Type.interface({
                acquire: Type.number,
                idle: Type.number,
                max: Type.number,
                min: Type.number
            })
        }),
        user: Type.string
    }),
    rethink: Type.interface<RethinkConfiguration>({
        db: Type.string,
        host: Type.string,
        password: Type.string,
        port: Type.number,
        user: Type.string
    }),
    sentry: Type.interface<SentryConfiguration>({
        base: Type.string,
        sampleRate: Type.number
    }),
    website: Type.interface<WebsiteConfiguration>({
        callback: Type.string,
        clientId: Type.string,
        host: Type.string,
        port: Type.number,
        secret: Type.string,
        secure: Type.boolean,
        sessionExpiry: Type.number,
        sessionSecret: Type.string
    })
});

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
    readonly concurrency?: number;
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
    readonly public: string;
    readonly suggestions: string;
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
