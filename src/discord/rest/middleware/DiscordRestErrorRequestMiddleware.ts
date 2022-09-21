import discord from 'discord-api-types/v10';

import { RequestOptions, ResponseMessage } from '../handler';
import { RequestMiddleware } from './RequestMiddleware';

export class DiscordRestErrorRequestMiddleware implements RequestMiddleware {
    public async invoke(_request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage> {
        const result = await next();
        if (result.statusCode < 300 && result.statusCode >= 200)
            return result;

        switch (result.statusCode) {
            case 200:
            case 201:
            case 204:
            case 304:
                return result;
            case 400: {
                if (result.headers['content-type'] !== 'application/json')
                    return result;

                const chunks = [];
                for await (const chunk of result.body)
                    chunks.push(chunk as Uint8Array);
                const buffer = Buffer.concat(chunks);
                const { message, code, errors } = JSON.parse(buffer.toString('utf-8')) as { code: discord.RESTJSONErrorCodes; message: string; errors: unknown; };
                const flatErrors = [...flattenErrors([], errors)];
                throw new Error(`Discord responsed with ${code}: ${message}${flatErrors.map(e => `\n${e.path} - ${e.code}: ${e.message}`).join('')}`);
            }
            case 401:
                throw new Error('Authorization token missing or invalid');
            case 403:
                throw new Error('Authorization token missing permission');
            case 404:
                throw new Error('Record not found');
            case 405:
                throw new Error('Method not allowed');
            case 429:
                throw new Error('Ratelimit not handled');
            case 502:
                throw new Error('Gateway unavailable');
            default:
                if (result.statusCode >= 500)
                    throw new Error(`Internal server error ${result.statusCode}`);
                // eslint-disable-next-line no-console
                console.warn('Unexpected response status code', result.statusCode);
                return result;
        }
    }
}

function* flattenErrors(path: string[], errors: unknown): Generator<{ path: string; code: string; message: string; }> {
    if (errors === null || typeof errors !== 'object')
        return;

    const { _errors } = errors as { '_errors'?: Array<{ code: string; message: string; }>; };
    if (_errors !== undefined) {
        for (const error of _errors)
            yield { path: `[${path.join('][')}]`, code: error.code, message: error.message };
    }

    for (const [key, child] of Object.entries<string, unknown>(errors))
        yield* flattenErrors([...path, JSON.stringify(key)], child);
}
