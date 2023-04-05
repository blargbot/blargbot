import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody } from '@blargbot/api-client';

export interface BBTagSourceIndex {
    readonly ownerId: bigint;
    readonly type: string;
    readonly name: string;
}

export interface BBTagSource {
    readonly value: string;
    readonly cooldown: number;
}

export interface BBTagSourceFilter {
    readonly ownerId: bigint;
    readonly type?: string;
    readonly name?: string;
}

export interface BBTagSetRequest extends BBTagSource, BBTagSourceIndex {

}

export interface BBTagAliasRequest {
    readonly alias: BBTagSourceIndex;
    readonly source: BBTagSourceIndex;
}

function getUrl(p: BBTagSourceFilter): string {
    return [p.ownerId.toString(), p.type, p.name]
        .filter((v): v is Exclude<typeof v, undefined> => v !== undefined)
        .map(v => encodeURIComponent(v))
        .join('/');
}

export class BBTagSourceHttpClient extends defineApiClient({
    get: b => b.route<BBTagSourceIndex>(getUrl)
        .response<BBTagSource>(200)
        .response(404),
    set: b => b.route<BBTagSetRequest>('PUT', getUrl)
        .body(({ value, cooldown }) => jsonBody({ value, cooldown }))
        .response(204),
    remove: b => b.route<BBTagSourceFilter>('DELETE', getUrl)
        .response(204),
    alias: b => b.route<BBTagAliasRequest>('PUT', x => getUrl(x.alias))
        .body(({ source }) => jsonBody({ source }))
        .response(204)
}) {
    public static from(options: BBTagSourceHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): BBTagSourceHttpClient {
        if (options instanceof BBTagSourceHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new BBTagSourceHttpClient(options);
    }
}
