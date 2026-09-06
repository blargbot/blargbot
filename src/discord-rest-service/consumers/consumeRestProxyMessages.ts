import type { DiscordResponse, DiscordRestQueue } from '@blargbot/contracts';
import { type Logger } from '@blargbot/logger';
import type { RestManager, RestRequestRejection } from '@discordeno/rest';
import z from 'zod';

export interface RestProxyOptions {
    readonly queue: DiscordRestQueue;
    readonly discord: RestManager;
    readonly logger: Logger;
}

export async function consumeRestProxyMessages(options: RestProxyOptions): Promise<void> {
    const { queue, discord, logger } = options;
    const discordError = function (): void { } as unknown as new () => RestRequestRejection;
    discordError.prototype = Object.getPrototypeOf(discord.createRequestError(new Error(), { ok: false, status: 0, statusText: '' }).cause) as RestRequestRejection;
    await queue.handle(
        async ({ method, url, ...options }) => {
            const response = await discord.makeRequest(method, url, options);
            if (response === undefined || response === null)
                return { status: 204, statusText: 'NoContent', body: undefined };
            return { status: 200, statusText: 'Ok', body: response };
        },
        {
            catch(error): DiscordResponse & { body: Omit<RestRequestRejection, 'status' | 'statusText'>; } {
                if (error instanceof z.ZodError) {
                    return {
                        status: 400,
                        statusText: 'BadRequest',
                        body: {
                            ok: false,
                            body: error.issues,
                            error: error.message
                        }
                    };
                }
                if (error instanceof Error && error.cause instanceof discordError) {
                    return {
                        status: error.cause.status,
                        statusText: error.cause.statusText,
                        body: {
                            ok: false,
                            body: error.cause.body,
                            error: error.cause.error
                        }
                    };
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
    logger.init(`Listening for AMQP messages on queue ${queue.name}`);
}
