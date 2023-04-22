import * as discordeno from 'discordeno';

export * from 'discordeno';

export function useRestErrors<Bot extends discordeno.Bot>(bot: Bot): Bot {
    bot.rest.convertRestError = convertRestError;
    return bot;
}

function convertRestError(errorStack: Error, data: discordeno.RestRequestRejection, response: unknown): DiscordenoRestError {
    const stackStart = errorStack.stack?.indexOf('\n    at') ?? -1;
    const stack = stackStart < 0 ? undefined : errorStack.stack?.slice(stackStart);
    const error = new DiscordenoRestError(data, response);
    error.stack = stack;
    return error;
}

export interface CreateProxiedBotOptions extends discordeno.CreateBotOptions {
    rest: NonNullable<discordeno.CreateBotOptions['rest']>;
}

export function createProxiedBot(options: CreateProxiedBotOptions): discordeno.Bot {
    const client = discordeno.createBot({
        ...options
    });
    client.rest = discordeno.createRestManager({
        ...options.rest,
        token: options.token
    });
    return client;
}

export class DiscordenoRestError extends Error {
    public constructor(
        public readonly data: discordeno.RestRequestRejection,
        public readonly response: unknown) {
        super(`[${data.status}] ${data.error}\n${data.body ?? ''}`.trim());
    }
}
