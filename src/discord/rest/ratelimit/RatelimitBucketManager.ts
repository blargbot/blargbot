import http from 'http';

import { RatelimitBucket } from './RatelimitBucket';

export class RatelimitBucketManager {
    readonly #bucketMap: Record<string, RatelimitBucket> = {};
    #timeout: NodeJS.Timeout | undefined;

    public get(id: string): RatelimitBucket {
        return this.#bucketMap[id] ??= new RatelimitBucket();

    }

    public readHeaders(id: string, headers: http.IncomingHttpHeaders): RatelimitBucket {
        const bucketHeader = headers['x-ratelimit-bucket'] ?? id;
        const newId = Array.isArray(bucketHeader) ? bucketHeader[0] : bucketHeader;

        const oldBucket = this.get(id);
        const newBucket = this.#bucketMap[id] = this.get(newId);
        if (oldBucket !== newBucket)
            oldBucket.moveTo(newBucket);

        if (headers['x-ratelimit-global'] === 'true') {
            this.#setAllBuckets({
                'x-ratelimit-limit': headers['x-ratelimit-limit'] = '0',
                'x-ratelimit-remaining': headers['x-ratelimit-remaining'] = '0'
            });
            this.#timeout ??= setTimeout(() => this.#setAllBuckets({
                'x-ratelimit-limit': '1',
                'x-ratelimit-remaining': '1'
            }), parseFloat(headers['retry-after'] ?? '1') * 1000);
        } else if (this.#timeout !== undefined) {
            clearTimeout(this.#timeout);
            this.#timeout = undefined;
        }

        newBucket.readHeaders(headers);
        return newBucket;
    }

    #setAllBuckets(headers: http.IncomingHttpHeaders): void {
        for (const bucket of Object.values(this.#bucketMap))
            bucket.readHeaders(headers);
    }
}
