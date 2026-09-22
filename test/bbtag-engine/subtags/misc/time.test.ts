import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

const now = moment.tz('2026-09-22T22:20:00Z', 'Etc/UTC');
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

await runSubtagTests({
    replacer: replacers.timeReplacer,
    argCountBounds: { min: 0, max: 5 },
    setup(ctx) {
        ctx.locals.setup(m => m.parseTime).returns((text, format, timezone) => {
            const m = parseWithMoment(text, format, timezone);
            if (!m.isValid())
                return undefined;
            return {
                toString(format, timezone) {
                    return m.tz(timezone).format(format);
                }
            };
        });
    },
    cases: [
        { code: '{time}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;;}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;;;}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;;;;}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },

        { code: '{time;;now}', expected: now.format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;today}', expected: now.clone().startOf('day').format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;tomorrow}', expected: now.clone().startOf('day').add(1, 'day').format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;yesterday}', expected: now.clone().startOf('day').add(-1, 'day').format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;10 minutes ago}', expected: now.clone().add(-10, 'minutes').format('YYYY-MM-DDTHH:mm:ssZ') },
        { code: '{time;;in 10 minutes}', expected: now.clone().add(10, 'minutes').format('YYYY-MM-DDTHH:mm:ssZ') },

        { code: '{time;X}', expected: now.format('X') },
        { code: '{time;X;}', expected: now.format('X') },
        { code: '{time;X;;}', expected: now.format('X') },
        { code: '{time;X;;;}', expected: now.format('X') },
        { code: '{time;X;;;;}', expected: now.format('X') },
        { code: '{time;DD/MM/YYYY}', expected: now.format('DD/MM/YYYY') },
        { code: '{time;DD/MM/YYYY;}', expected: now.format('DD/MM/YYYY') },
        { code: '{time;DD/MM/YYYY;;}', expected: now.format('DD/MM/YYYY') },
        { code: '{time;DD/MM/YYYY;;;}', expected: now.format('DD/MM/YYYY') },
        { code: '{time;DD/MM/YYYY;;;;}', expected: now.format('DD/MM/YYYY') },

        { code: '{time;;1640995200}', expected: '`Invalid date`', errors: [{ start: 0, end: 18, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;;1640995200;}', expected: '`Invalid date`', errors: [{ start: 0, end: 19, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;;1640995200;;}', expected: '`Invalid date`', errors: [{ start: 0, end: 20, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;;1640995200;;;}', expected: '`Invalid date`', errors: [{ start: 0, end: 21, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;X;1640995200}', expected: '`Invalid date`', errors: [{ start: 0, end: 19, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;X;1640995200;}', expected: '`Invalid date`', errors: [{ start: 0, end: 20, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;X;1640995200;;}', expected: '`Invalid date`', errors: [{ start: 0, end: 21, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;X;1640995200;;;}', expected: '`Invalid date`', errors: [{ start: 0, end: 22, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;DD/MM/YYYY;1640995200}', expected: '`Invalid date`', errors: [{ start: 0, end: 28, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;DD/MM/YYYY;1640995200;}', expected: '`Invalid date`', errors: [{ start: 0, end: 29, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;DD/MM/YYYY;1640995200;;}', expected: '`Invalid date`', errors: [{ start: 0, end: 30, error: new BBTagRuntimeError('Invalid date') }] },
        { code: '{time;DD/MM/YYYY;1640995200;;;}', expected: '`Invalid date`', errors: [{ start: 0, end: 31, error: new BBTagRuntimeError('Invalid date') }] },

        { code: '{time;;1640995200;X}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;;1640995200;X;}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;;1640995200;X;;}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;X;1640995200;X}', expected: '1640995200' },
        { code: '{time;X;1640995200;X;}', expected: '1640995200' },
        { code: '{time;X;1640995200;X;;}', expected: '1640995200' },
        { code: '{time;DD/MM/YYYY;1640995200;X}', expected: '01/01/2022' },
        { code: '{time;DD/MM/YYYY;1640995200;X;}', expected: '01/01/2022' },
        { code: '{time;DD/MM/YYYY;1640995200;X;;}', expected: '01/01/2022' },
        { code: '{time;;01/01/2022;DD/MM/YYYY}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;;}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY}', expected: '1640995200' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;}', expected: '1640995200' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;;}', expected: '1640995200' },
        { code: '{time;DD/MM/YYYY;01/01/2022;DD/MM/YYYY}', expected: '01/01/2022' },
        { code: '{time;DD/MM/YYYY;01/01/2022;DD/MM/YYYY;}', expected: '01/01/2022' },
        { code: '{time;DD/MM/YYYY;01/01/2022;DD/MM/YYYY;;}', expected: '01/01/2022' },

        { code: '{time;;01/01/2022;DD/MM/YYYY;Etc/UTC}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Etc/UTC;}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Etc/UTC}', expected: '1640995200' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Etc/UTC;}', expected: '1640995200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Etc/UTC}', expected: '01/01/2022 00:00' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Etc/UTC;}', expected: '01/01/2022 00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Europe/Berlin}', expected: '2021-12-31T23:00:00+00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Europe/Berlin;}', expected: '2021-12-31T23:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Europe/Berlin}', expected: '1640991600' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Europe/Berlin;}', expected: '1640991600' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Europe/Berlin}', expected: '31/12/2021 23:00' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Europe/Berlin;}', expected: '31/12/2021 23:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;America/New_York}', expected: '2022-01-01T05:00:00+00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;America/New_York;}', expected: '2022-01-01T05:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;America/New_York}', expected: '1641013200' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;America/New_York;}', expected: '1641013200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;America/New_York}', expected: '01/01/2022 05:00' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;America/New_York;}', expected: '01/01/2022 05:00' },

        { code: '{time;;01/01/2022;DD/MM/YYYY;Etc/UTC;Etc/UTC}', expected: '2022-01-01T00:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Etc/UTC;Etc/UTC}', expected: '1640995200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Etc/UTC;Etc/UTC}', expected: '01/01/2022 00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Europe/Berlin;Etc/UTC}', expected: '2021-12-31T23:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Europe/Berlin;Etc/UTC}', expected: '1640991600' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Europe/Berlin;Etc/UTC}', expected: '31/12/2021 23:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;America/New_York;Etc/UTC}', expected: '2022-01-01T05:00:00+00:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;America/New_York;Etc/UTC}', expected: '1641013200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;America/New_York;Etc/UTC}', expected: '01/01/2022 05:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Etc/UTC;Europe/Berlin}', expected: '2022-01-01T01:00:00+01:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Etc/UTC;Europe/Berlin}', expected: '1640995200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Etc/UTC;Europe/Berlin}', expected: '01/01/2022 01:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Europe/Berlin;Europe/Berlin}', expected: '2022-01-01T00:00:00+01:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Europe/Berlin;Europe/Berlin}', expected: '1640991600' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Europe/Berlin;Europe/Berlin}', expected: '01/01/2022 00:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;America/New_York;Europe/Berlin}', expected: '2022-01-01T06:00:00+01:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;America/New_York;Europe/Berlin}', expected: '1641013200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;America/New_York;Europe/Berlin}', expected: '01/01/2022 06:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Etc/UTC;America/New_York}', expected: '2021-12-31T19:00:00-05:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Etc/UTC;America/New_York}', expected: '1640995200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Etc/UTC;America/New_York}', expected: '31/12/2021 19:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;Europe/Berlin;America/New_York}', expected: '2021-12-31T18:00:00-05:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;Europe/Berlin;America/New_York}', expected: '1640991600' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;Europe/Berlin;America/New_York}', expected: '31/12/2021 18:00' },
        { code: '{time;;01/01/2022;DD/MM/YYYY;America/New_York;America/New_York}', expected: '2022-01-01T00:00:00-05:00' },
        { code: '{time;X;01/01/2022;DD/MM/YYYY;America/New_York;America/New_York}', expected: '1641013200' },
        { code: '{time;DD/MM/YYYY HH:mm;01/01/2022;DD/MM/YYYY;America/New_York;America/New_York}', expected: '01/01/2022 00:00' }
    ]
});

function parseWithMoment(text: string, format: string, timezone: string): moment.Moment {
    const result = now.clone();
    if (text === '')
        return result;

    switch (text.toLowerCase()) {
        case 'now': return result;
        case 'today': return result.startOf('day');
        case 'tomorrow': return result.startOf('day').add(1, 'day');
        case 'yesterday': return result.startOf('day').add(-1, 'days');
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
        if (!Object.hasOwn(prettyTimeMagnitudes, key))
            throw new Error(`Invalid quantity ${match[2]}`);
        const quantity = prettyTimeMagnitudes[key];
        return result.add(magnitude, quantity);
    }

    return format.length === 0
        ? moment.tz(text, timezone)
        : moment.tz(text, format, timezone);
}
