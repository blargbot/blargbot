import getEnvVar from './getEnvVar.js';

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
    imageApiToken: [String, 'IMAGE_API_TOKEN']
} as const;

export type CommonEnvVariables = {
    [P in keyof typeof envVarDeclaration]: ReturnType<typeof envVarDeclaration[P][0]>
}

export const wellKnown = Object.freeze(
    Object.defineProperties({},
        Object.fromEntries(
            (Object.entries(envVarDeclaration) as Array<{ [P in keyof typeof envVarDeclaration]: [P, typeof envVarDeclaration[P], string?] }[keyof typeof envVarDeclaration]>)
                .map(([key, [read, id, fallback]]) => {
                    let value: unknown;
                    return [key, {
                        get: () => value ??= getEnvVar<unknown>(read, id, fallback)
                    }] as const;
                })
        )
    ) as CommonEnvVariables
);
export default wellKnown;
