import type { VariableReference } from './VariableReference.js';

export interface IVariableCache {
    cached: VariableReference[];
    get(variable: string): Awaitable<VariableReference>;
    set(variable: string, value: JToken | undefined): Awaitable<void>;
    reset(variables?: string[]): void;
    persist(variables?: string[]): Awaitable<void>;
}
