import type { BBTagClosureValue } from './BBTagClosureValue.js';

export class BBTagClosureData {
    readonly #data: Record<string, BBTagClosureValue>;
    readonly #scopes: Record<string, object>;

    public constructor(parent?: BBTagClosureData) {
        this.#data = Object.create(parent === undefined ? null : parent.#data) as Record<symbol, unknown>;
        this.#scopes = parent === undefined ? {} : parent.#scopes;
    }

    #getKey(scope: object, key: string): string {
        const name = scope.constructor.name;
        if (!(name in this.#scopes))
            this.#scopes[name] = scope;
        else if (this.#scopes[name] !== scope)
            throw new Error(`Multiple scopes with the same name found: ${name}`);
        return `${name}[${key}]`;
    }

    public get<T extends BBTagClosureValue>(scope: object, key: string): T | undefined
    public get(scope: object, key: string): BBTagClosureValue | undefined {
        return this.#data[this.#getKey(scope, key)];
    }

    public set<T extends BBTagClosureValue>(scope: object, key: string, value: T): void
    public set(scope: object, key: string, value: BBTagClosureValue): void {
        this.#data[this.#getKey(scope, key)] = value;
    }

    public ensure<T extends BBTagClosureValue>(scope: object, key: string, value: () => T): T
    public ensure(scope: object, key: string, value: () => BBTagClosureValue): BBTagClosureValue {
        return this.#data[this.#getKey(scope, key)] ??= value();
    }

    public revert(scope: object, key: string): boolean {
        key = this.#getKey(scope, key);
        if (!Object.prototype.hasOwnProperty.call(this.#data, key))
            return false;

        delete this.#data[key];
        return true;
    }

    public serialize(): Record<string, BBTagClosureValue> {
        return JSON.parse(JSON.stringify(this.#data)) as Record<string, BBTagClosureValue>;
    }

    public load(data: Record<string, BBTagClosureValue>): void {
        Object.assign(this.#data, JSON.parse(JSON.stringify(data)));
    }
}
