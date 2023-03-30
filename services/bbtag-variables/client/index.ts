import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody } from '@blargbot/api-client';
import { json } from '@blargbot/serialization';

export interface BBTagVariable {
    readonly ownerId: bigint;
    readonly scope: string;
    readonly name: string;
    readonly value: JToken;
}

export const bbtagVariableSerializer = json.object<BBTagVariable>({
    name: json.string,
    ownerId: json.bigint,
    scope: json.string,
    value: json.jToken
});

export interface BBTagVariableScope {
    readonly ownerId: bigint;
    readonly scope: string;
}

export interface ClearBBTagVariablesRequest {
    readonly ownerId: bigint;
    readonly scope?: string;
}
export interface GetBBTagVariableRequest extends BBTagVariableScope {
    readonly name: string;
}
export interface GetBBTagVariablesRequest extends BBTagVariableScope {
    readonly names: Iterable<string>;
}
export const getBBTagVariablesResponseSerializer = json.array(bbtagVariableSerializer);
export type SetBBTagVariableRequest = BBTagVariable;
export interface SetBBTagVariablesRequest extends BBTagVariableScope {
    readonly values: Record<string, JToken>;
}

export class BBTagVariableHttpClient extends defineApiClient({
    getVariable: b => b.route<GetBBTagVariableRequest>(x => `${x.ownerId}/${encodeURIComponent(x.scope)}/${encodeURIComponent(x.name)}`)
        .response(200, bbtagVariableSerializer.fromBlob),
    getVariables: b => b.route<GetBBTagVariablesRequest>(x => `${x.ownerId}/${encodeURIComponent(x.scope)}`)
        .query(x => ({ name: [...x.names] }))
        .response(200, getBBTagVariablesResponseSerializer.fromBlob),
    setVariable: b => b.route<SetBBTagVariableRequest>('PUT', x => `${x.ownerId}/${encodeURIComponent(x.scope)}/${encodeURIComponent(x.name)}`)
        .body(x => jsonBody({ value: x.value }))
        .response(204),
    setVariables: b => b.route<SetBBTagVariablesRequest>('PUT', x => `${x.ownerId}/${encodeURIComponent(x.scope)}`)
        .body(x => jsonBody(x.values))
        .response(204),
    clear: b => b.route<ClearBBTagVariablesRequest>('DELETE', x => `${x.ownerId}/${x.scope === undefined ? '' : encodeURIComponent(x.scope)}`)
        .response(204)
}) {
    public static from(options: BBTagVariableHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): BBTagVariableHttpClient {
        if (options instanceof BBTagVariableHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new BBTagVariableHttpClient(options);
    }
}
