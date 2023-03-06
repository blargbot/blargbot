import type { BBTagContext } from '@bbtag/blargbot';

export function createCancelledAlerter(type: string): (query: string, context: BBTagContext) => Promise<void> {
    return async function cancelled(query, ctx) {
        await ctx.engine.dependencies.message.create(ctx, ctx.channel.id, {
            content: `No ${type} matching \`${query}\` found in ${ctx.isCC ? 'custom command' : 'tag'} \`${ctx.rootTagName}\`.`
        });
    };
}

export function createNotFoundAlerter(type: string): (query: string, context: BBTagContext) => Promise<void> {
    return async function notFound(_, ctx) {
        await ctx.engine.dependencies.message.create(ctx, ctx.channel.id, {
            content: `${type} query canceled in ${ctx.isCC ? 'custom command' : 'tag'} \`${ctx.rootTagName}\`.`
        });
    };
}
