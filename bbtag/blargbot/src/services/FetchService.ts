export interface FetchService {
    send(url: string, init?: FetchRequest): Promise<FetchResponse>
}

export interface FetchRequest {
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly size?: number;
    readonly body?: string;
}

export interface FetchResponse {
    readonly status: number;
    readonly statusText: string;
    readonly headers: {
        get(header: string): string | null;
    };
    readonly url: string;

    text(): Promise<string>;
    json(): Promise<unknown>;
    arrayBuffer(): Promise<ArrayBuffer>;
}