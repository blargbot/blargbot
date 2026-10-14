import type { SubtagCall } from './language/index.js';
import { memoize } from './memoize.js';

export class SubtagCallStack {
    readonly #callCounts: Record<string, number | undefined>;
    readonly #nameStack: string[];
    readonly #callStack: SubtagCall[];

    public constructor() {
        this.#nameStack = [];
        this.#callStack = [];
        this.#callCounts = {};
    }

    public push(subtagName: string, subtag: SubtagCall): Disposable {
        this.#nameStack.push(subtagName);
        this.#callStack.push(subtag);
        this.#callCounts[subtagName] = (this.#callCounts[subtagName] ?? 0) + 1;
        return {
            [Symbol.dispose]: memoize(() => {
                const subtagName = this.#nameStack.pop();
                if (subtagName === undefined)
                    throw new Error('Callstack is empty');
                this.#callStack.pop();
                this.#callCounts[subtagName]!--;
            })
        };
    }

    public contains(subtagName: string): boolean {
        return (this.#callCounts[subtagName] ?? 0) > 0;
    }

    public lastIndexOf(subtagName: string): number {
        return this.#nameStack.lastIndexOf(subtagName);
    }

    public get(index: number): { subtag: SubtagCall; name: string; } | undefined {
        if (this.#callStack.length < index || index < 0)
            return undefined;
        return { subtag: this.#callStack[index], name: this.#nameStack[index] };
    }
}
