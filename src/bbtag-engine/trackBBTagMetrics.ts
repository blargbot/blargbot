import type { BBTagReplacer } from './BBTagReplacer.js';

export interface BBTagMetricsLocals {
    readonly metrics: {
        onReplacerCalled(id: string, elapsedMs: number): void;
    };
}

export function trackBBTagMetrics<Locals extends Record<string, unknown>>(id: string, replacer: BBTagReplacer<Locals>): BBTagReplacer<Locals & BBTagMetricsLocals> {
    return async function* trackMetrics(ctx, name, bbtag) {
        const start = performance.now();
        try {
            yield* await replacer(ctx, name, bbtag);
        } finally {
            ctx.locals.metrics.onReplacerCalled(id, performance.now() - start);
        }
    };
}
