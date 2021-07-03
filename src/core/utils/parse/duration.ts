import moment, { Duration, DurationInputArg2 } from 'moment-timezone';

export function duration(text: string, fallback: Duration): Duration;
export function duration(text: string, fallback?: Duration): Duration | undefined;
export function duration(text: string, fallback?: Duration): Duration | undefined {
    const durations = [
        find(text, /([0-9]+) ?(day|days|d)\b/i, 'd'),
        find(text, /([0-9]+) ?(hours|hour|h)\b/i, 'h'),
        find(text, /([0-9]+) ?(minutes|minute|mins|min|m)\b/i, 'm'),
        find(text, /((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)\b/i, 's')
    ].filter((d): d is Duration => d !== undefined);
    if (durations.length === 0)
        return fallback;
    return durations.reduce((p, c) => p.add(c));
}

function find(text: string, regex: RegExp, unit: DurationInputArg2): Duration | undefined {
    const match = regex.exec(text);
    if (match === null)
        return undefined;
    return moment.duration(parseFloat(match[1]), unit);
}
