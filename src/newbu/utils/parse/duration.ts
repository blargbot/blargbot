import moment, { Duration } from 'moment-timezone';

export function duration(text: string): Duration {
    return moment.duration()
        .add(find(text, /([0-9]+) ?(day|days|d)/i), 'd')
        .add(find(text, /([0-9]+) ?(hours|hour|h)/i), 'h')
        .add(find(text, /([0-9]+) ?(minutes|minute|mins|min|m)/i), 'm')
        .add(find(text, /((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i), 'ms');
}

function find(text: string, regex: RegExp): number {
    const match = regex.exec(text);
    if (!match)
        return 0;
    return parseFloat(match[1]);
}