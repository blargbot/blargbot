export class SubtagCallStack {
    private readonly callCounts: Record<string, number | undefined>;
    private readonly stack: string[];

    public constructor() {
        this.stack = [];
        this.callCounts = {};
    }

    public push(subtagName: string): void {
        this.stack.push(subtagName);
        this.callCounts[subtagName] = (this.callCounts[subtagName] ?? 0) + 1;
    }

    public pop(): void {
        const subtagName = this.stack.pop();
        if (subtagName === undefined)
            throw new Error('Callstack is empty');
        (<number>this.callCounts[subtagName])--;
    }

    public contains(subtagName: string): boolean {
        return (this.callCounts[subtagName] ?? 0) > 0;
    }

    public lastIndexOf(subtagName: string): number {
        return this.stack.lastIndexOf(subtagName);
    }
}
