import moment from 'moment-timezone';

export function parseDuration(text: string, fallback: moment.Duration): moment.Duration;
export function parseDuration(text: string, fallback?: moment.Duration): moment.Duration | undefined;
export function parseDuration(text: string, fallback?: moment.Duration): moment.Duration | undefined {
    const ctx = { text };
    const durations = [
        find(ctx, /([0-9]+) ?(years?|y)\b/i, 'years'),
        find(ctx, /([0-9]+) ?(months?)\b/i, 'months'),
        find(ctx, /([0-9]+) ?(M)\b/, 'months'),
        find(ctx, /([0-9]+) ?(weeks?|w)\b/i, 'weeks'),
        find(ctx, /([0-9]+) ?(days?|d)\b/i, 'days'),
        find(ctx, /([0-9]+) ?(hours?|h)\b/i, 'hours'),
        find(ctx, /([0-9]+) ?(minutes?|mins?|m)\b/i, 'minutes'),
        find(ctx, /((?:[0-9]*[.])?[0-9]+) ?(seconds?|secs?|s)\b/i, 'seconds'),
        find(ctx, /([0-9]+) ?(milliseconds?|ms)\b/i, 'milliseconds')
    ].filter((d): d is moment.Duration => d !== undefined);

    if (durations.length === 0 || ctx.text.trim().length > 0)
        return fallback;
    return durations.reduce((p, c) => p.add(c));
}

function find(context: { text: string; }, regex: RegExp, unit: moment.DurationInputArg2): moment.Duration | undefined {
    let result: string | undefined;
    context.text = context.text.replace(regex, (_, quantity: string) => {
        result = quantity;
        return '';
    });
    if (result === undefined)
        return undefined;
    return moment.duration(parseFloat(result), unit);
}
