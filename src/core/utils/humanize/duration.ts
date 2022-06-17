import moment, { Duration, Moment } from 'moment-timezone';

import { smartJoin } from './smartJoin';

export function duration(duration: Duration, partsLimit?: number): string;
export function duration(start: Moment, end: Moment, partsLimit?: number): string;
export function duration(...args: [Duration, number?] | [Moment, Moment, number?]): string {
    let diff;
    let partsLimit: number | undefined;
    if (!moment.isDuration(args[0]) && moment.isMoment(args[1])) {
        diff = moment.duration(args[0].diff(args[1]));
        partsLimit = args[2];
    } else {
        diff = args[0];
        partsLimit = typeof args[1] === 'number' ? args[1] : undefined;
    }

    const parts = [];
    if (diff.days() > 0) parts.push(pluralDuration('day', diff.days()));
    if (diff.hours() > 0) parts.push(pluralDuration('hour', diff.hours()));
    if (diff.minutes() > 0) parts.push(pluralDuration('minute', diff.minutes()));
    if (diff.seconds() > 0) parts.push(pluralDuration('second', diff.seconds()));
    if (diff.milliseconds() > 0) parts.push(pluralDuration('millisecond', diff.milliseconds()));

    if (parts.length === 0)
        return '0 seconds';
    if (partsLimit !== undefined)
        return smartJoin(parts.slice(0, partsLimit), ', ', ' and ');
    return smartJoin(parts, ', ', ' and ');
}

function pluralDuration(text: string, amount: number): string {
    return `${amount} ${text}` + (amount > 1 ? 's' : '');
}
