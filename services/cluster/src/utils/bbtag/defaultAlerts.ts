import type { BBTagRuntime } from '@bbtag/blargbot';

export function createCancelledAlerter(type: string): (query: string, context: BBTagRuntime) => Promise<void> {
    return async function cancelled(query, ctx) {
        await ctx.runner.messages.create(ctx, ctx.channel.id, {
            content: `No ${type} matching \`${query}\` found in ${ctx.isCC ? 'custom command' : 'tag'} \`${ctx.entrypoint.name}\`.`
        });
    };
}

export function createNotFoundAlerter(type: string): (query: string, context: BBTagRuntime) => Promise<void> {
    return async function notFound(_, ctx) {
        await ctx.runner.messages.create(ctx, ctx.channel.id, {
            content: `${type} query canceled in ${ctx.isCC ? 'custom command' : 'tag'} \`${ctx.entrypoint.name}\`.`
        });
    };
}
