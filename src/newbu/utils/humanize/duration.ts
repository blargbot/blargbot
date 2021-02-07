import moment, { Moment } from 'moment-timezone';

export function duration(start: Moment, end: Moment): string {
    const diff = moment.duration(start.diff(end));
    const days = diff.days() > 0 ? `${diff.days()} days, ` : '';
    const hours = diff.hours() > 0 ? `${diff.hours()} hours, ` : '';
    const minutes = `${diff.minutes()} minutes, `;
    const seconds = `${diff.seconds()} seconds`;
    return `${days}${hours}${minutes}and${seconds}`;
}