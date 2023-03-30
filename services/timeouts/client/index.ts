import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody } from '@blargbot/api-client';

import type { TimeoutDetails } from './TimeoutDetails.js';
import { timeoutDetailsCreateSerializer } from './TimeoutDetails.js';

export * from './TimeoutDetails.js';

export interface TimeoutOwnerParams {
    readonly ownerId: bigint;
}

export interface TimeoutListParams extends TimeoutOwnerParams {
    readonly offset?: number;
    readonly count?: number;
}

export interface TimeoutGetParams extends TimeoutOwnerParams {
    readonly id: string;
}

export type TimeoutCreateBody = Omit<TimeoutDetails, 'id' | 'ownerId'>

export interface TimeoutCreateRequest extends TimeoutOwnerParams, TimeoutCreateBody {

}

export interface TimeoutCreateResponse {
    readonly id: string;
}
export type TimeoutGetResponse = TimeoutDetails

export interface TimeoutListResponse {
    readonly timers: TimeoutDetails[];
    readonly total: number;
}

export class TimeoutHttpClient extends defineApiClient({
    getTimeouts: b => b.route<TimeoutListParams>(x => `${x.ownerId}/timers`)
        .query(x => ({ offset: x.offset, count: x.count }))
        .response<TimeoutListResponse>(200),
    createTimeout: b => b.route<TimeoutCreateRequest>('POST', x => `${x.ownerId}/timers`)
        .body(x => jsonBody(x, timeoutDetailsCreateSerializer))
        .response<TimeoutCreateResponse>(200),
    clearTimeouts: b => b.route<TimeoutOwnerParams>('DELETE', x => `${x.ownerId}/timers`)
        .response(204),
    getTimeout: b => b.route<TimeoutGetParams>(x => `${x.ownerId}/timers/${x.id}`)
        .response<TimeoutDetails>(200)
        .response(404, () => undefined),
    cancelTimeout: b => b.route<TimeoutGetParams>('DELETE', x => `${x.ownerId}/timers/${x.id}`)
        .response(204)
}) {
    public static from(options: TimeoutHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): TimeoutHttpClient {
        if (options instanceof TimeoutHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new TimeoutHttpClient(options);
    }
}
