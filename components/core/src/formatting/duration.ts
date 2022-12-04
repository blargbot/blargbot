import type { IFormatter, IValueResolverTransform } from '@blargbot/formatting';
import { format } from '@blargbot/formatting';
import moment from 'moment-timezone';

import templates from '../text.js';

const formats: { [P in string]?: (duration: moment.Duration, formatter: IFormatter) => string } = {
    ['']: d => d.humanize(),
    ['H']: d => d.humanize(),
    ['S']: (d, f) => d.asSeconds().toLocaleString(f.locale),
    ['MS']: (d, f) => d.asMilliseconds().toLocaleString(f.locale),
    ['F'](d, f) {
        const comparer = new Intl.Collator(f.locale.toString());
        return templates.common.duration.full.template({
            parts: (['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'] as const)
                .map(x => ({
                    value: d.get(x),
                    ...templates.common.duration.full[x]
                }))
                .map(x => ({
                    order: x.order[format](f),
                    display: x.display({ value: x.value })[format](f)
                }))
                .filter(x => x.display.length > 0)
                .sort((a, b) => comparer.compare(a.order, b.order))
                .map(x => x.display)
        })[format](f);
    }
};

export const duration: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        const fmt = formats[args.join('|')];
        if (fmt === undefined)
            throw new Error(`Unknown format ${JSON.stringify(args.join('|'))}`);
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;

            const asDuration = moment.isDuration(value) ? value
                : moment.isMoment(value) ? moment.duration(value.diff(moment()))
                    : typeof value === 'number' ? moment.duration(value)
                        : undefined;
            if (asDuration === undefined || !asDuration.isValid())
                throw new Error('Invalid duration');

            return fmt(
                asDuration.locale(ctx.formatter.locale.baseName),
                ctx.formatter
            );
        };
    }
};
