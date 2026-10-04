import { BBTagRuntimeError, InvalidDurationError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { LockLocals, SleepLocals, TimerLocals } from './locals.js';

export const sleepReplacer = defineReplacer<SleepLocals>('sleep', {
    parameters: ['duration'],
    returns: 'nothing',
    execute: async function sleep(ctx, [{ value: duration }]) {
        const durationMs = parse.duration(duration, { throw: InvalidDurationError });
        const maxSleepMs = 5 * 60 * 1000;
        await ctx.locals.sleep(Math.min(durationMs, maxSleepMs));
    }
});
export const timerReplacer = defineReplacer<TimerLocals>('timer', {
    parameters: ['~code', 'duration'],
    returns: 'nothing',
    execute: async function timer(ctx, [{ code }, { value: duration }]) {
        const durationMs = parse.duration(duration, { throw: InvalidDurationError });
        if (durationMs <= 0)
            throw new InvalidDurationError(duration);

        await ctx.locals.schedule(ctx, code, durationMs);
    }
});
export const lockReplacer = defineReplacer<LockLocals>('lock', {
    parameters: ['mode', 'key', '~code'],
    returns: 'string',
    execute: async function lock(ctx, [{ value: mode }, { value: key }, code]) {
        if (ctx.locals.inLock)
            throw new BBTagRuntimeError('Lock cannot be nested');
        mode = mode.toLowerCase();
        if (mode !== 'read' && mode !== 'write')
            throw new BBTagRuntimeError('Mode must be \'read\' or \'write\'', mode);
        if (key.length === 0)
            throw new BBTagRuntimeError('Key cannot be empty');
        await using _lock = await ctx.locals.lock(mode, key);
        ctx.locals.inLock = true;
        try {
            return await code.execute();
        } finally {
            ctx.locals.inLock = false;
        }
    }
});
