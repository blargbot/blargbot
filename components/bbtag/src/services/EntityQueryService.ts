import type { BBTagContext } from '../BBTagContext.js';
import type { FindEntityOptions } from '../types.js';

export interface EntityQueryService<Entity> {
    querySingle(context: BBTagContext, query: string, options?: FindEntityOptions): Promise<Entity | undefined>;
}
