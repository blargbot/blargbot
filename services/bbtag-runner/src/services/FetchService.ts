import type { FetchRequest, FetchResponse, FetchService as BBTagFetchService } from '@bbtag/blargbot';
import { BBTagRuntimeError } from '@bbtag/blargbot';
import type { DomainWhitelistHttpClient } from '@blargbot/domain-whitelist-client';
import type { RequestInit } from 'node-fetch';
import type fetch from 'node-fetch';

const domainRegex = /^https?:\/\/(.+?)(?:\/.?|$)/i;
export class FetchService implements BBTagFetchService {
    readonly #domains: DomainWhitelistHttpClient;
    readonly #fetchOptions: Partial<RequestInit>;
    readonly #fetch: typeof fetch;

    public constructor(domains: DomainWhitelistHttpClient, fetchOptions: Partial<RequestInit> & { fetch: typeof fetch; }) {
        this.#domains = domains;
        const { fetch, ...options } = fetchOptions;
        this.#fetchOptions = options;
        this.#fetch = fetch;
    }

    public async send(url: string, init?: FetchRequest | undefined): Promise<FetchResponse> {
        const domainMatch = domainRegex.exec(url);
        if (domainMatch === null)
            throw new BBTagRuntimeError(`A domain could not be extracted from url: ${url}`);

        const domain = domainMatch[1];
        if (!await this.#domains.check({ domain }))
            throw new BBTagRuntimeError(`Domain is not whitelisted: ${domain}`);

        return await this.#fetch(url, {
            ...this.#fetchOptions,
            ...init
        });
    }
}
