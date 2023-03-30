import { Timer } from '@blargbot/timer';

import { ContextManager } from './ContextManager.js';

export class BBTagRuntimeMetrics {
    readonly #execTimer: Timer;
    readonly #dbTimer: Timer;
    readonly #dbManager: ContextManager;
    readonly #subtagManager: ContextManager<[id: string], number>;
    readonly #subtags: Partial<Record<string, number[]>>;

    public dbObjectsCommitted: number;

    public get activeTime(): number {
        return this.#execTimer.elapsed;
    }

    public get dbTime(): number {
        return this.#dbTimer.elapsed;
    }

    public get subtags(): Readonly<Record<string, readonly number[]>> {
        return Object.fromEntries(Object.entries(this.#subtags).map(x => [x[0], [...x[1] ?? []] as const] as const));
    }

    public constructor() {
        this.dbObjectsCommitted = 0;
        this.#subtags = {};
        this.#execTimer = new Timer().start();
        this.#dbTimer = new Timer();
        this.#dbManager = new ContextManager({
            enter: () => {
                this.#execTimer.end();
                this.#dbTimer.resume();
            },
            exit: () => {
                this.#dbTimer.end();
                this.#execTimer.resume();
            }
        });
        this.#subtagManager = new ContextManager<[id: string], number>({
            enter: () => performance.now(),
            exit: (start, id) => (this.#subtags[id] ??= []).push(performance.now() - start)
        });
    }

    public timeDb<T>(action: () => T): T {
        return this.#dbManager.invoke(action);
    }

    public timeSubtag<T>(id: string, action: () => T): T {
        return this.#subtagManager.invoke(action, id);
    }
}
