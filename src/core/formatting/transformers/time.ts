import moment, { MomentInput } from 'moment-timezone';

import { IValueResolverTransform } from '../FormatStringCompiler';

export const time: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        const format = args.join(`|`);
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            const time = moment.isMoment(value) ? value : moment(value as MomentInput);
            if (!time.isValid())
                throw new Error(`Value is not a valid time`);
            return time.locale(ctx.formatter.locale.language).format(format);
        };
    }
};
