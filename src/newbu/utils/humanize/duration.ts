import moment, { Moment } from 'moment-timezone';

export function duration(start: Moment, end: Moment) {
    let diff = moment.duration(start.diff(end));
    let days = diff.days() > 0 ? diff.days() + ' days, ' : '';
    let hours = diff.hours() > 0 ? diff.hours() + ' hours, ' : '';
    let minutes = diff.minutes() + ' minutes, ';
    let seconds = diff.seconds() + ' seconds';
    return `${days}${hours}${minutes}and${seconds}`;
};