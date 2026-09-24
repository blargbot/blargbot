import type { BBTagContext } from './BBTagContext.js';
import type { BBTagReplacer } from './BBTagReplacer.js';
import type { BBTagReplaceResult } from './BBTagReplaceResult.js';
import type { BBTagSubtag } from './language/BBTagSubtag.js';

export function defineMiddleware<Locals extends object, Args extends readonly unknown[]>(
    impl: (...args: [...Args, context: BBTagContext<Locals>, name: string, bbtag: BBTagSubtag, next: () => BBTagReplaceResult]) => BBTagReplaceResult,
    name?: (innerName: string | null) => string | null,
    aliases?: (innerAliases: ReadonlySet<string>) => Iterable<string>,
    canReplace?: (name: string, next: () => boolean) => boolean
): <OwnLocals extends object>(...args: [...Args, next: BBTagReplacer<OwnLocals>]) => BBTagReplacer<Locals & OwnLocals> {
    return function middleware(...x) {
        const next = x.at(-1) as BBTagReplacer;
        const args = x.slice(0, -1) as [...Args];

        return {
            name: name === undefined ? next.name : name(next.name),
            aliases: new Set(aliases === undefined ? next.aliases : aliases(next.aliases)),
            canReplace: canReplace === undefined ? next.canReplace : v => canReplace(v, () => next.canReplace(v)),
            replace(context, name, bbtag) {
                return impl(...args, context, name, bbtag, () => next.replace(context, name, bbtag));
            }
        };
    };
}

export const throttleMiddleware = defineMiddleware<{ readonly throttle: { callCount: number; }; }, [throttleAt: number, delayMs: number]>(
    async function* (throttleAt, delayMs, ctx, _name, _bbtag, next) {
        for await (const item of await next()) {
            if (ctx.locals.throttle.callCount++ >= throttleAt)
                await new Promise(res => setTimeout(res, delayMs));
            yield item;
        }
    }
);

export interface BBTagMetricsLocals {
    readonly metrics: {
        onReplacerCalled(id: string, elapsedMs: number): void;
    };
}

export const trackMetricsMiddleware = defineMiddleware<BBTagMetricsLocals, [id: string]>(
    async function* (id, ctx, _name, _bbtag, next) {
        const start = performance.now();
        try {
            yield* await next();
        } finally {
            ctx.locals.metrics.onReplacerCalled(id, performance.now() - start);
        }
    }
);
