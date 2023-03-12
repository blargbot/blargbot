import moment from 'moment-timezone';

export function resolveDuration<T>(duration: moment.Duration | T, relativeTo = moment()): moment.Duration | T {
    if (!moment.isDuration(duration))
        return duration;
    return moment.duration(relativeTo.clone().add(duration).diff(relativeTo));
}
