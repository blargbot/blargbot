import type { BBTagContext } from '../BBTagContext.js';

export interface EntityFetchService<Entity, Key> {
    get(context: BBTagContext, id: Key): Promise<Entity | undefined>;
    getAll(context: BBTagContext): Promise<Entity[]>;
}
