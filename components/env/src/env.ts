import getEnvVar from './getEnvVar.js';
import getEnvVars from './getEnvVars.js';

const envVarDeclaration = {
    appPort: [Number, 'APP_PORT', '80'],
    discordToken: [String, 'DISCORD_TOKEN'],
    restProxyUrl: [String, 'REST_PROXY_URL'],
    restProxySecret: [String, 'REST_PROXY_SECRET'],
    shardsPerWorker: [Number, 'SHARDS_PER_WORKER'],
    rabbitHost: [String, 'RABBITMQ_HOST'],
    rabbitPassword: [String, 'RABBITMQ_PASSWORD'],
    rabbitUsername: [String, 'RABBITMQ_USERNAME'],

    imageApiUrl: [String, 'IMAGE_API_URL'],
    imageApiToken: [String, 'IMAGE_API_TOKEN'],

    cassandraContactPoints: [String, /^CASSANDRA_CONTACT_POINT_(\d+)$/, (a, b) => Number(a[1]) - Number(b[1])],
    cassandraKeyspace: [String, 'CASSANDRA_KEYSPACE'],
    cassandraUsername: [String, 'CASSANDRA_USER'],
    cassandraPassword: [String, 'CASSANDRA_PASSWORD']
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
