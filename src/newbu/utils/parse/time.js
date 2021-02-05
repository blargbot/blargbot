"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.time = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
function time(text, format, timezone = 'Etc/UTC') {
    let now = moment_timezone_1.default.tz(timezone);
    if (!text)
        return now;
    switch (text.toLowerCase()) {
        case 'now': return now;
        case 'today': return now.startOf('day');
        case 'tomorrow': return now.startOf('day').add(1, 'day');
        case 'yesterday': return now.startOf('day').add(-1, 'days');
    }
    let match = text.match(/^\s*in\s+(-?\d+(?:\.\d+)?)\s+(\S+)\s*$/i), sign = 1;
    if (match == null)
        match = text.match(/^\s*(-?\d+(?:\.\d+)?)\s+(\S+)\s+ago\s*$/i), sign = -1;
    if (match != null) {
        let magnitude = sign * parseFloat(match[1]);
        let key = match[2].toLowerCase();
        if (!(key in prettyTimeMagnitudes))
            return 'Invalid quantity ' + match[2];
        let quantity = prettyTimeMagnitudes[key];
        return now.add(magnitude, quantity);
    }
    let tz = format === undefined
        ? moment_timezone_1.default.tz(text, timezone)
        : moment_timezone_1.default.tz(text, format, timezone);
    return tz.utcOffset(0);
}
exports.time = time;
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
};
