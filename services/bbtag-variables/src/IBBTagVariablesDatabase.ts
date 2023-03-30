import type { BBTagVariable } from '@blargbot/bbtag-variables-client';

export interface IBBTagVariablesDatabase {
    get(ownerId: bigint, scope: string, name: string): Awaitable<BBTagVariable | undefined>;
    getAll(ownerId: bigint, scope: string, names: Iterable<string>): Awaitable<BBTagVariable[]>;
    set(ownerId: bigint, scope: string, name: string, value: JToken | undefined): Awaitable<void>;
    setAll(ownerId: bigint, scope: string, values: Record<string, JToken | undefined>): Awaitable<void>;
    clear(ownerId: bigint, scope?: string): Awaitable<void>;
}
