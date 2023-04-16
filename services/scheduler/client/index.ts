import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody } from '@blargbot/api-client';

import type { ScheduledMessage } from './ScheduledMessage.js';
import { scheduledMessageCreateSerializer } from './ScheduledMessage.js';

export * from './ScheduledMessage.js';

export interface ScheduleOwnerParams {
    readonly ownerId: bigint;
}

export interface ScheduleListParams extends ScheduleOwnerParams {
    readonly offset?: number;
    readonly count?: number;
}

export interface ScheduleGetParams extends ScheduleOwnerParams {
    readonly id: string;
}

export type ScheduleCreateBody = Omit<ScheduledMessage, 'id' | 'ownerId'>

export interface ScheduleCreateRequest extends ScheduleOwnerParams, ScheduleCreateBody {

}

export interface ScheduleCreateResponse {
    readonly id: string;
}
export type ScheduleGetResponse = ScheduledMessage

export interface ScheduleListResponse {
    readonly timers: ScheduledMessage[];
    readonly total: number;
}

export class SchedulerHttpClient extends defineApiClient({
    getMessages: b => b.route<ScheduleListParams>(x => `${x.ownerId}/timers`)
        .query(x => ({ offset: x.offset, count: x.count }))
        .response<ScheduleListResponse>(200),
    scheduleMessage: b => b.route<ScheduleCreateRequest>('POST', x => `${x.ownerId}/timers`)
        .body(x => jsonBody(x, scheduledMessageCreateSerializer))
        .response<ScheduleCreateResponse>(200),
    clearMessages: b => b.route<ScheduleOwnerParams>('DELETE', x => `${x.ownerId}/timers`)
        .response(204),
    getMessage: b => b.route<ScheduleGetParams>(x => `${x.ownerId}/timers/${x.id}`)
        .response<ScheduledMessage>(200)
        .response(404, () => undefined),
    cancelMessage: b => b.route<ScheduleGetParams>('DELETE', x => `${x.ownerId}/timers/${x.id}`)
        .response(204)
}) {
    public static from(options: SchedulerHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): SchedulerHttpClient {
        if (options instanceof SchedulerHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new SchedulerHttpClient(options);
    }
}
