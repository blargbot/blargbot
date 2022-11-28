import { SubtagCall } from './language';

export class SubtagCallStack {
    readonly #callCounts: Record<string, number | undefined>;
    readonly #nameStack: string[];
    readonly #callStack: SubtagCall[];

    public constructor() {
        this.#nameStack = [];
        this.#callStack = [];
        this.#callCounts = {};
    }

    public push(subtagName: string, subtag: SubtagCall): void {
        this.#nameStack.push(subtagName);
        this.#callStack.push(subtag);
        this.#callCounts[subtagName] = (this.#callCounts[subtagName] ?? 0) + 1;
    }

    public pop(): void {
        const subtagName = this.#nameStack.pop();
        if (subtagName === undefined)
            throw new Error('Callstack is empty');
        this.#callStack.pop();
        (<number>this.#callCounts[subtagName])--;
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
