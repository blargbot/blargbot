import moment from 'moment-timezone';

import { guard } from '../guard/index.js';

export function parseTime(text: 'now' | 'today' | 'tomorrow' | 'yesterday' | string, format?: string, timezone = 'Etc/UTC'): moment.Moment {
    const now = moment.tz(timezone);
    if (text === '')
        return now;

    switch (text.toLowerCase()) {
        case 'now': return now;
        case 'today': return now.startOf('day');
        case 'tomorrow': return now.startOf('day').add(1, 'day');
        case 'yesterday': return now.startOf('day').add(-1, 'days');
    }

    let match = /^\s*in\s+(-?\d+(?:\.\d+)?)\s+(\S+)\s*$/i.exec(text);
    let sign = 1;
    if (match === null) {
        match = /^\s*(-?\d+(?:\.\d+)?)\s+(\S+)\s+ago\s*$/i.exec(text);
        sign = -1;
    }
    if (match !== null) {
        const magnitude = sign * parseFloat(match[1]);
        const key = match[2].toLowerCase();
        if (!guard.hasProperty(prettyTimeMagnitudes, key))
            throw new Error(`Invalid quantity ${match[2]}`);
        const quantity = prettyTimeMagnitudes[key];
        return now.add(magnitude, quantity);
    }

    return format === undefined || format.length === 0
        ? moment.tz(text, timezone)
        : moment.tz(text, format, timezone);
}

/* eslint-disable @typescript-eslint/naming-convention */
const prettyTimeMagnitudes = {
    //defaults
    year: 'year', years: 'years', y: 'y',
    month: 'month', months: 'months', M: 'M',
    week: 'week', weeks: 'weeks', w: 'w',
    day: 'day', days: 'days', d: 'd',
    hour: 'hour', hours: 'hours', h: 'h',
    minute: 'minute', minutes: 'minutes', m: 'm',
    second: 'second', seconds: 'seconds', s: 's',
    millisecond: 'millisecond', milliseconds: 'milliseconds', ms: 'ms',
    quarter: 'quarter', quarters: 'quarters', q: 'Q',
    //Custom
    mins: 'minutes', min: 'minute'
} as const;
/* eslint-enable @typescript-eslint/naming-convention */
