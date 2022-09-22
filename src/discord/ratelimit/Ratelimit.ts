import http from 'http';
import { performance } from 'perf_hooks';

const i32Limit = ~(1 << 31);

export class Ratelimit {
    /** The normal priority queue waiting for a spot in the ratelimit to free up. */
    readonly #pending: Array<() => void> = [];
    /** The high priority queue waiting for a spot in the ratelimit to free up. */
    readonly #pendingPriority: Array<() => void> = [];
    /** The maximum number of actions permitted per reset */
    #limit: number;
    /** The remaining number of actions for this reset period */
    #remaining: number;
    /** The number of actions to reserve for priority calls. */
    readonly #reserve: number;
    /** The timestamp at which point the number of remaining actions resets */
    #reset = Number.MAX_SAFE_INTEGER;
    /** How many ms between each reset by default */
    readonly #resetInterval = Number.MAX_SAFE_INTEGER;
    /** A flag to prevent recursive check calls */
    #processing = false;
    /** The timeout at which point the reset will be performed */
    #timeout: NodeJS.Timeout | undefined;

    public constructor(limit: number, reserve: number, resetInterval: number) {
        this.#limit = this.#remaining = limit;
        this.#resetInterval = resetInterval;
        this.#reserve = reserve;
    }

    #check(): void {
        if (this.#processing)
            return;

        this.#processing = true;
        try {
            this.#checkCore();
            if (this.#pending.length > 0) {
                if (this.#reset < i32Limit) {
                    this.#timeout ??= setTimeout(() => this.#check(), this.#reset - performance.now());
                }
            } else if (this.#timeout !== undefined) {
                clearTimeout(this.#timeout);
                this.#timeout = undefined;
            }
        } finally {
            this.#processing = false;
        }
    }

    #checkCore(): void {
        if (this.#reset < performance.now()) {
            this.#remaining = this.#limit;
            this.#reset = performance.now() + this.#resetInterval;
        }

        if (this.#remaining <= 0)
            return;

        let next = this.#pendingPriority.shift();
        if (next === undefined && this.#remaining > this.#reserve)
            next = this.#pending.shift();
        if (next === undefined)
            return;

        this.#remaining--;
        next();
    }

    public async wait(abort?: AbortSignal, priority = false): Promise<void> {
        const queue = priority ? this.#pending : this.#pendingPriority;
        await new Promise((res, rej) => {
            if (abort?.aborted === true)
                return res(false);

            const success = (): void => {
                res(true);
                abort?.removeEventListener('abort', failed);
            };
            const failed = (): void => {
                rej(abort?.reason);
                const index = queue.indexOf(success);
                if (index !== -1)
                    queue.splice(index, 1);
            };

            abort?.addEventListener('abort', failed);
            queue.push(success);
            this.#check();
        });
    }

    public release(): void {
        this.#check();
    }

    public update(limit: number | undefined, remaining: number | undefined, resetAfter: number | undefined): void {
        const oldLimit = this.#limit;
        if (limit !== undefined)
            this.#limit = limit;

        if (remaining !== undefined) {
            if (remaining < this.#remaining)
                this.#remaining = remaining;
            else if (this.#limit !== oldLimit)
                this.#remaining = Math.min(this.#remaining + this.#limit - oldLimit, remaining);
        }

        if (resetAfter !== undefined)
            this.#reset = performance.now() + resetAfter;
        else if (this.#reset === Number.MAX_SAFE_INTEGER && this.#limit === 1 && this.#remaining === 0)
            this.#limit = this.#remaining = Number.MAX_VALUE;

        this.#check();
    }

    public readHeaders(headers: http.IncomingHttpHeaders): void {
        let resetAfter = this.#getHeader(headers, 'x-ratelimit-reset-after');
        if (resetAfter !== undefined)
            resetAfter *= 1000;

        this.update(
            this.#getHeader(headers, 'x-ratelimit-limit'),
            this.#getHeader(headers, 'x-ratelimit-remaining'),
            resetAfter
        );
    }

    #getHeader(headers: http.IncomingHttpHeaders, header: string): number | undefined {
        const value = headers[header];
        switch (typeof value) {
            case 'string': return parseFloat(value);
            case 'object': return parseFloat(value[0]);
            case 'undefined': return undefined;
        }
    }

    public moveTo(other: Ratelimit): void {
        other.#pending.push(...this.#pending);
        other.#limit = this.#limit;
        other.#reset = this.#reset;
        this.#pending.splice(0, Number.MAX_SAFE_INTEGER);
    }
}
