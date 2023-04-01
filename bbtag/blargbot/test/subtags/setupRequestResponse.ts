import type { FetchRequest, FetchResponse } from '@bbtag/blargbot';
import { argument } from '@blargbot/test-util/mock.js';

import type { SubtagTestContext } from './SubtagTestSuite.js';

interface TestFetchResponse {
    readonly status?: number;
    readonly statusText?: string;
    readonly headers?: Record<string, string>;
    readonly url?: string;
    readonly text?: string | Error;
    readonly json?: JToken | Error;
    readonly arrayBuffer?: ArrayBuffer | Error;
}

export function setupRequestResponse(ctx: SubtagTestContext, url: string, request: FetchRequest | undefined | null, response: TestFetchResponse): void {
    const mockResponse = ctx.createMock<FetchResponse>();

    const setup = request === null
        ? ctx.inject.fetch.setup(m => m.send(url))
        : ctx.inject.fetch.setup(m => m.send(url, argument.isDeepEqual(request)));
    setup.thenResolve(mockResponse.instance);

    mockResponse.setup(m => m.url, false).thenReturn(response.url ?? url);
    if (response.status !== undefined)
        mockResponse.setup(m => m.status, false).thenReturn(response.status);
    if (response.statusText !== undefined)
        mockResponse.setup(m => m.statusText, false).thenReturn(response.statusText);
    if (response.headers !== undefined) {
        const mockHeaders = ctx.createMock<{ get(name: string): string; }>();
        for (const [name, value] of Object.entries(response.headers))
            mockHeaders.setup(m => m.get(name)).thenReturn(value);
        mockResponse.setup(m => m.headers, false).thenReturn(mockHeaders.instance);
    }
    if (response.text !== undefined) {
        const setup = mockResponse.setup(m => m.text());
        if (response.text instanceof Error)
            setup.thenReject(response.text);

        else
            setup.thenResolve(response.text);
    }
    if (response.json !== undefined) {
        const setup = mockResponse.setup(m => m.json());
        if (response.json instanceof Error)
            setup.thenReject(response.json);

        else
            setup.thenResolve(response.json);
    }
    if (response.arrayBuffer !== undefined) {
        const setup = mockResponse.setup(m => m.arrayBuffer());
        if (response.arrayBuffer instanceof Error)
            setup.thenReject(response.arrayBuffer);

        else
            setup.thenResolve(response.arrayBuffer);
    }
}
