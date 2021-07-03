import moment, { Moment } from 'moment-timezone';

export function time(text: 'now' | 'today' | 'tomorrow' | 'yesterday' | string, format?: string, timezone = 'Etc/UTC'): Moment {
    const now = moment.tz(timezone);
    if (!text)
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
        if (!prettyTimeMagnitudes.hasOwnProperty(key))
            throw new Error('Invalid quantity ' + match[2]);
        const quantity = prettyTimeMagnitudes[key];
        return now.add(magnitude, quantity);
    }

    const tz = format === undefined
        ? moment.tz(text, timezone)
        : moment.tz(text, format, timezone);
    return tz.utcOffset(0);
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