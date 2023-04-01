import type { FetchRequest, FetchResponse, FetchService as BBTagFetchService } from '@bbtag/blargbot';

export class FetchService implements BBTagFetchService {
    public send(url: string, init?: FetchRequest | undefined): Promise<FetchResponse> {
        url;
        init;
        throw new Error('Method not implemented.');
    }
}
