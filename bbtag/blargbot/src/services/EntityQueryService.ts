import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { FindEntityOptions } from '../types.js';

export interface EntityQueryService<Entity> {
    querySingle(context: BBTagRuntime, query: string, options?: FindEntityOptions): Promise<Entity | undefined>;
}
