import moment, { Duration } from 'moment-timezone';

import { humanize } from '../../utils/index';
import { IValueResolverTransform } from '../FormatStringCompiler';

export const duration: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        let format = (duration: Duration): string => duration.humanize();
        switch (args.length) {
            case 0: break;
            default: throw new Error('Duration can only accept 1 arg');
            case 1: switch (args[0]) {
                case 'H': break;
                case 'S':
                    format = d => d.asSeconds().toString();
                    break;
                case 'MS':
                    format = d => d.asMilliseconds().toString();
                    break;
                case 'F':
                    format = d => humanize.duration(d);
                    break;
                default: throw new Error('Unrecognised duration format');
            }
        }

        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;

            const asDuration = moment.isDuration(value) ? value : typeof value === 'number' ? moment.duration(value) : undefined;
            if (asDuration === undefined || !asDuration.isValid())
                throw new Error('Invalid duration');

            asDuration.locale(ctx.formatter.locale.baseName);
            return format(asDuration);
        };
    }
};
