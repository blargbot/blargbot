import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { NsfwLocals, QuietLocals, ReasonLocals, SuppressLookupLocals } from './locals.js';

export const nsfwReplacer = defineReplacer<NsfwLocals>('nsfw', {
    parameters: ['message?:❌ This contains NSFW content! Go to a NSFW channel. ❌'],
    returns: 'nothing',
    execute: function nsfw(context, [{ value: text }]) {
        context.locals.nsfw.value = text;
    }
});
export const quietReplacer = defineReplacer<QuietLocals>('quiet', {
    parameters: ['isQuiet?:true'],
    returns: 'nothing',
    execute: function quiet(ctx, [{ value: quiet }]) {
        ctx.locals.quiet = parse.boolean(quiet);
    }
});
export const reasonReplacer = defineReplacer<ReasonLocals>('reason', {
    parameters: ['reason?'],
    returns: 'nothing',
    execute: function reason(ctx, [{ value: reason }]) {
        ctx.locals.reason = reason;
    }
});
export const suppressLookupReplacer = defineReplacer<SuppressLookupLocals>('suppressLookup', {
    parameters: ['value?:true'],
    returns: 'nothing',
    execute: function suppressLookup(ctx, [{ value: value }]) {
        ctx.locals.suppressLookup = value === '' || parse.boolean(value, { throw: true });
    }
});
