import { RuntimeLimitRule } from '../../../types';

export class UseCountRule implements RuntimeLimitRule {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #initial: number;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #type: [error: string, display: string];
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #remaining: number;

    public constructor(count: number, type: [error: string, display: string] = ['Usage', 'uses']) {
        this.#initial = count;
        this.#remaining = count;
        this.#type = type;
    }

    public check(): boolean {
        return this.#remaining-- > 0;
    }
    public errorText(subtagName: string): string {
        return `${this.#type[0]} limit reached for {${subtagName}}`;
    }
    public displayText(): string {
        return `Maximum ${this.#initial} ${this.#type[1]}`;
    }
    public state(): number {
        return this.#remaining;
    }
    public load(state: JToken): void {
        if (typeof state !== 'number')
            throw new Error(`Invalid state ${JSON.stringify(state)}`);

        this.#remaining = state;
    }
}