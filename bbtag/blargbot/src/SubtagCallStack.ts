import type { BBTagCall } from './BBTagCall.js';
import { ContextManager } from './ContextManager.js';

export class SubtagCallStack {
    readonly #callCounts: Record<string, number | undefined>;
    readonly #nameStack: string[];
    readonly #callStack: BBTagCall[];
    readonly #manager: ContextManager<[subtagName: string, subtag: BBTagCall]>;

    public constructor() {
        this.#nameStack = [];
        this.#callStack = [];
        this.#callCounts = {};
        this.#manager = new ContextManager({
            enter: (subtagName: string, subtag: BBTagCall) => {
                this.#nameStack.push(subtagName);
                this.#callStack.push(subtag);
                this.#callCounts[subtagName] = (this.#callCounts[subtagName] ?? 0) + 1;
            },
            exit: () => {
                const subtagName = this.#nameStack.pop();
                if (subtagName === undefined)
                    throw new Error('Callstack is empty');
                this.#callStack.pop();
                (<number>this.#callCounts[subtagName])--;
            }
        });
    }

    public invoke<T>(subtagName: string, subtag: BBTagCall, action: () => T): T {
        return this.#manager.invoke(action, subtagName, subtag);
    }

    public contains(subtagName: string): boolean {
        return (this.#callCounts[subtagName] ?? 0) > 0;
    }

    public lastIndexOf(subtagName: string): number {
        return this.#nameStack.lastIndexOf(subtagName);
    }

    public get(index: number): { subtag: BBTagCall; name: string; } | undefined {
        if (this.#callStack.length < index || index < 0)
            return undefined;
        return { subtag: this.#callStack[index], name: this.#nameStack[index] };
    }
}
