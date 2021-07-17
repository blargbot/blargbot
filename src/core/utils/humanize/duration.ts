import moment, { Duration, Moment } from 'moment-timezone';

import { smartJoin } from './smartJoin';

export function duration(duration: Duration): string;
export function duration(start: Moment, end: Moment): string;
export function duration(...args: [Duration] | [Moment, Moment]): string {
    const diff = args.length === 1 ? args[0] : moment.duration(args[0].diff(args[1]));
    const parts = [];
    if (diff.days() > 0) parts.push(`${diff.days()} days`);
    if (diff.hours() > 0) parts.push(`${diff.hours()} hours`);
    if (diff.minutes() > 0) parts.push(`${diff.minutes()} minutes`);
    if (diff.seconds() > 0) parts.push(`${diff.seconds()} seconds`);
    if (diff.milliseconds() > 0) parts.push(`${diff.milliseconds()} milliseconds`);

    if (parts.length === 0)
        return '0 seconds';

    return smartJoin(parts, ', ', ' and ');
}
