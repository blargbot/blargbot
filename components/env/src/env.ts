import getEnvVar from './getEnvVar.js';
import getEnvVars from './getEnvVars.js';

const envVarDeclaration = {
    discordProxyUrl: [String, 'DISCORD_PROXY_URL'],
    discordProxySecret: [String, 'DISCORD_PROXY_SECRET'],
    guildSettingsUrl: [String, 'GUILD_SETTINGS_URL'],
    discordGuildCacheUrl: [String, 'DISCORD_GUILD_CACHE_URL'],
    discordRoleCacheUrl: [String, 'DISCORD_ROLE_CACHE_URL'],
    userSettingsUrl: [String, 'USER_SETTINGS_URL'],
    discordUserCacheUrl: [String, 'DISCORD_USER_CACHE_URL'],
    discordChannelCacheUrl: [String, 'DISCORD_CHANNEL_CACHE_URL'],
    bbtagVariablesUrl: [String, 'BBTAG_VARIABLES_URL'],

    appPort: [Number, 'APP_PORT', '80'],
    discordToken: [String, 'DISCORD_TOKEN'],
    shardsPerWorker: [Number, 'SHARDS_PER_WORKER'],
    rabbitPrefetch: [v => v === '' ? undefined : Number(v), 'RABBITMQ_PREFETCH', ''],
    rabbitHost: [String, 'RABBITMQ_HOST'],
    rabbitPassword: [String, 'RABBITMQ_PASSWORD'],
    rabbitUsername: [String, 'RABBITMQ_USERNAME'],

    imageApiUrl: [String, 'IMAGE_API_URL'],
    imageApiToken: [String, 'IMAGE_API_TOKEN'],

    cassandraContactPoints: [String, /^CASSANDRA_CONTACT_POINT_(\d+)$/, (a, b) => Number(a[1]) - Number(b[1])],
    cassandraKeyspace: [String, 'CASSANDRA_KEYSPACE'],
    cassandraUsername: [String, 'CASSANDRA_USERNAME'],
    cassandraPassword: [String, 'CASSANDRA_PASSWORD'],

    redisUrl: [String, 'REDIS_URL'],
    redisUsername: [String, 'REDIS_USERNAME'],
    redisPassword: [String, 'REDIS_PASSWORD'],
    redisTTL: [Number, 'REDIS_TTL'],

    postgresHost: [String, 'POSTGRES_HOST'],
    postgresDatabase: [String, 'POSTGRES_DB'],
    postgresUser: [String, 'POSTGRES_USER'],
    postgresPassword: [String, 'POSTGRES_PASSWORD']
} as const satisfies {
    readonly [key: string]:
    | readonly [(value: string) => unknown, string, string?]
    | readonly [(value: string) => unknown, RegExp, ((a: string[], b: string[]) => number)?];
};

export type CommonEnvVariables = {
    [P in keyof typeof envVarDeclaration]: typeof envVarDeclaration[P][1] extends string ? ReturnType<typeof envVarDeclaration[P][0]> : Array<ReturnType<typeof envVarDeclaration[P][0]>>
} & {
    get: typeof getEnvVar;
}

export const env = Object.freeze(
    Object.defineProperties({
        get: getEnvVar,
        getMany: getEnvVars
    }, Object.fromEntries(
        (Object.entries(envVarDeclaration) as Array<{ [P in keyof typeof envVarDeclaration]: [P, typeof envVarDeclaration[P], string?] }[keyof typeof envVarDeclaration]>)
            .map(([key, [read, id, fallback]]) => {
                let value: unknown;
                return [key, {
                    get: () => value ??= typeof id === 'string'
                        ? getEnvVar<unknown>(read, id, fallback as string)
                        : getEnvVars<unknown>(read, id, fallback as Exclude<typeof fallback, string>)
                }] as const;
            })
    )) as CommonEnvVariables
);
export default env;
