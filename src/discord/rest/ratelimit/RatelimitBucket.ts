import EventEmitter from 'events';
import http from 'http';
import { performance } from 'perf_hooks';

const i32Limit = ~(1 << 31);

export class RatelimitBucket {
    /** The queue waiting for a spot in the ratelimit to free up. */
    readonly #pending: Array<() => void> = [];
    /** The maximum number of actions permitted per reset. Negative values means there are no limits */
    #limit = 1;
    /** The remaining number of actions for this reset period. Negative values means there are no limits. */
    #remaining = 1;
    /** The timestamp at which point the number of remaining actions resets */
    #reset = Number.MAX_SAFE_INTEGER;
    /** A flag to prevent recursive check calls */
    #processing = false;
    /** The timeout at which point the reset will be performed */
    #timeout: NodeJS.Timeout | undefined;

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
        if (this.#reset < performance.now())
            this.#remaining = this.#limit;

        if (this.#remaining === 0)
            return;

        const next = this.#pending.shift();
        if (next === undefined)
            return;

        this.#remaining--;
        next();
    }

    public async wait(abort?: AbortSignal): Promise<void> {
        const success = abort === undefined
            ? await new Promise<boolean>(res => {
                this.#pending.push(() => res(true));
                this.#check();
            })
            : await new Promise<boolean>(res => {
                const events = abort as unknown as EventEmitter;
                const success = (): void => {
                    res(true);
                    events.off('abort', failed);
                };
                const failed = (): void => {
                    res(false);
                    const index = this.#pending.indexOf(success);
                    if (index !== -1)
                        this.#pending.splice(index, 1);
                };

                events.once('abort', failed);
                this.#pending.push(success);
                this.#check();
            });

        if (!success)
            throw new Error('Request aborted!');
    }

    public release(): void {
        this.#check();
    }

    public readHeaders(headers: http.IncomingHttpHeaders): void {
        const oldLimit = this.#limit;
        const limitHeader = this.#getHeader(headers, 'x-ratelimit-limit');
        if (limitHeader !== undefined)
            this.#limit = limitHeader;

        const remainingHeader = this.#getHeader(headers, 'x-ratelimit-remaining');
        if (remainingHeader !== undefined) {
            if (remainingHeader < this.#remaining)
                this.#remaining = remainingHeader;
            else if (this.#limit !== oldLimit)
                this.#remaining = Math.min(this.#remaining + this.#limit - oldLimit, remainingHeader);
        }

        const resetAfterHeader = this.#getHeader(headers, 'x-ratelimit-reset-after');
        if (resetAfterHeader !== undefined)
            this.#reset = performance.now() + resetAfterHeader * 1000;
        else if (this.#reset === Number.MAX_SAFE_INTEGER && this.#limit === 1 && this.#remaining === 0)
            this.#limit = this.#remaining = -1;

        this.#check();
    }

    #getHeader(headers: http.IncomingHttpHeaders, header: string): number | undefined {
        const value = headers[header];
        switch (typeof value) {
            case 'string': return parseFloat(value);
            case 'object': return parseFloat(value[0]);
            case 'undefined': return undefined;
        }
    }

    public moveTo(other: RatelimitBucket): void {
        other.#pending.push(...this.#pending);
        other.#limit = this.#limit;
        other.#reset = this.#reset;
        this.#pending.splice(0, Number.MAX_SAFE_INTEGER);
    }
}
