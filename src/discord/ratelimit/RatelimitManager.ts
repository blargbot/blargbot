import http from 'http';

import { Ratelimit } from './Ratelimit';

export class RatelimitManager {
    readonly #ratelimitMap: Record<string, Ratelimit> = {};
    #timeout: NodeJS.Timeout | undefined;

    public get(id: string): Ratelimit {
        return this.#ratelimitMap[id] ??= new Ratelimit(1, 0, Number.MAX_SAFE_INTEGER);

    }

    public update(id: string, newId: string | undefined, disableFor: number | undefined, limit: number | undefined, remaining: number | undefined, resetAfter: number | undefined): Ratelimit {
        let ratelimit = this.get(id);
        if (newId !== undefined) {
            const newRatelimit = this.#ratelimitMap[id] = this.get(newId);
            if (ratelimit !== newRatelimit)
                ratelimit.moveTo(newRatelimit);
            ratelimit = newRatelimit;
        }

        if (disableFor !== undefined) {
            this.#updateAllBuckets(limit = 0, remaining = 0, resetAfter);
            this.#timeout ??= setTimeout(() => this.#updateAllBuckets(1, 1, resetAfter), disableFor);
        } else {
            if (this.#timeout !== undefined) {
                clearTimeout(this.#timeout);
                this.#timeout = undefined;
            }
            ratelimit.update(limit, remaining, resetAfter);
        }
        return ratelimit;
    }

    public readHeaders(id: string, headers: http.IncomingHttpHeaders): Ratelimit {
        const bucketHeader = headers['x-ratelimit-bucket'] ?? id;
        const newId = Array.isArray(bucketHeader) ? bucketHeader[0] : bucketHeader;

        const oldBucket = this.get(id);
        const newBucket = this.#ratelimitMap[id] = this.get(newId);
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

    #updateAllBuckets(limit: number | undefined, remaining: number | undefined, resetAfter: number | undefined): void {
        for (const bucket of Object.values(this.#ratelimitMap))
            bucket.update(limit, remaining, resetAfter);
    }

    #setAllBuckets(headers: http.IncomingHttpHeaders): void {
        for (const bucket of Object.values(this.#ratelimitMap))
            bucket.readHeaders(headers);
    }
}
