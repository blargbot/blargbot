import * as discordeno from 'discordeno';

export interface CreateDiscordRestClientOptions {
    readonly token: string;
    readonly url: string;
    readonly secret: string;
}

export function createDiscordRestClient(options: CreateDiscordRestClientOptions): discordeno.Bot {
    const client = discordeno.createBot({
        token: options.token
    });
    client.rest = discordeno.createRestManager({
        token: options.token,
        secretKey: options.secret,
        customUrl: options.url,
        debug: console.debug
    });
    return client;
}
