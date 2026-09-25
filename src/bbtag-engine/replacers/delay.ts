import { BBTagRuntimeError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import type { LockLocals, SleepLocals, TimerLocals } from './locals.js';

export const sleepReplacer = defineReplacer<SleepLocals>('sleep', {
    parameters: ['duration'],
    returns: 'nothing',
    execute: async function sleep(ctx, [{ value: duration }]) {
        const durationMs = parseDuration(duration);
        await ctx.locals.sleep(durationMs);
    }
});
export const timerReplacer = defineReplacer<TimerLocals>('timer', {
    parameters: ['~code', 'duration'],
    returns: 'nothing',
    execute: async function timer(ctx, [{ code }, { value: duration }]) {
        const durationMs = parseDuration(duration);
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

function parseDuration(duration: string): number {
    let matched = false;
    let result = 0;
    for (const { regex, scale } of durationMatchers) {
        duration = duration.replaceAll(regex, (_, count: string) => {
            result += scale * parseFloat(count);
            matched = true;
            return '';
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!matched || duration.trim().length > 0)
        throw new BBTagRuntimeError('Invalid duration');

    return result;
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;
const year = 365.25 * day;
const durationMatchers = [
    { names: ['years', 'year', 'y'], flags: 'i', scale: year },
    { names: ['months', 'month'], flags: 'i', scale: month },
    { names: ['M'], flags: '', scale: month },
    { names: ['weeks', 'week', 'w'], flags: 'i', scale: week },
    { names: ['days', 'day', 'd'], flags: 'i', scale: day },
    { names: ['hours', 'hour', 'h'], flags: 'i', scale: hour },
    { names: ['minutes', 'minute', 'm'], flags: 'i', scale: minute },
    { names: ['seconds', 'second', 's'], flags: 'i', scale: second },
    { names: ['milliseconds', 'millisecond', 'ms'], flags: 'i', scale: 1 }
].map(x => ({
    regex: new RegExp(`(\\d+) *(${x.names.join('|')})\\b`, `${x.flags}g`),
    scale: x.scale
}));
