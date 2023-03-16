import type { BBTagRuntime } from '../BBTagRuntime.js';

export interface EntityFetchService<Entity, Key> {
    get(context: BBTagRuntime, id: Key): Promise<Entity | undefined>;
    getAll(context: BBTagRuntime): Promise<Entity[]>;
}
