import type { DiscordRestChannel } from '@blargbot/contracts';
import type { RestManager } from '@discordeno/rest';
import z from 'zod';

export interface RestProxyOptions {
    readonly channel: DiscordRestChannel;
    readonly discord: RestManager;
}

export async function consumeRestProxyMessages(options: RestProxyOptions): Promise<AsyncDisposable> {
    const { channel, discord } = options;
    return await channel.handle(
        async ({ method, url, ...options }) => {
            try {
                const response = await discord.makeRequest(method, url, options);
                if (response === undefined || response === null)
                    return { status: 204, statusText: 'NoContent', body: undefined };
                return { status: 200, statusText: 'Ok', body: response };
            } catch (error) {
                if (error instanceof Error) {
                    const parsed = discordenoErrorCause.safeParse(error.cause);
                    if (parsed.success) {
                        const { status, statusText, ...body } = parsed.data;
                        return { status, statusText, body };
                    }
                }
                return {
                    status: 500,
                    statusText: 'InternalServerError',
                    body: {
                        ok: false,
                        body: 'Unexpected error',
                        error: String(error)
                    }
                };
            }
        }
    );
}

const discordenoErrorCause = z.object({
    ok: z.boolean(),
    status: z.number(),
    statusText: z.string().optional(),
    error: z.string().optional(),
    body: z.unknown()
});
