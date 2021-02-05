import moment from 'moment-timezone';

export function duration(text: string) {
    return moment.duration()
        .add(find(text, /([0-9]+) ?(day|days|d)/i), 'd')
        .add(find(text, /([0-9]+) ?(hours|hour|h)/i), 'h')
        .add(find(text, /([0-9]+) ?(minutes|minute|mins|min|m)/i), 'm')
        .add(find(text, /((?:[0-9]*[.])?[0-9]+) ?(seconds|second|secs|sec|s)/i), 'ms');
}

function find(text: string, regex: RegExp) {
    let match = text.match(regex);
    if (!match)
        return 0;
    return parseFloat(match[1]);
}