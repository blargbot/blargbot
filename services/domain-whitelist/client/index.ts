import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody, readResponse } from '@blargbot/api-client';

export interface DomainWhitelistData {
    readonly whitelisted: boolean;
}

export interface DomainWhitelistRequestParameters {
    readonly domain: string;
}

export interface DomainWhitelistUpdateRequest extends DomainWhitelistData, DomainWhitelistRequestParameters {

}

export class DomainWhitelistHttpClient extends defineApiClient({
    check: b => b.route<DomainWhitelistRequestParameters>(x => `${encodeURIComponent(x.domain)}`)
        .response(200, async x => (await readResponse<DomainWhitelistData>(x)).whitelisted),
    set: b => b.route<DomainWhitelistUpdateRequest>('PATCH', x => `${encodeURIComponent(x.domain)}`)
        .body(({ whitelisted }) => jsonBody({ whitelisted }))
        .response(204),
    remove: b => b.route<DomainWhitelistRequestParameters>('DELETE', x => `${encodeURIComponent(x.domain)}`)
        .response(204)
}) {
    public static from(options: DomainWhitelistHttpClient | HttpClient | HttpClientOptions | string | URL | undefined): DomainWhitelistHttpClient {
        if (options instanceof DomainWhitelistHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new DomainWhitelistHttpClient(options);
    }
}
