import { format } from '../../types.js';
import { isFormattable, toArray } from '../../util/index.js';
import type { IValueResolverTransform } from '../types.js';

export const join: IValueResolverTransform = {
    transform(_compiler, source, ...separators) {
        if (separators.length === 0)
            throw new Error('At least 1 separator must be given');
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            const res = toArray(value)
                .map(v => isFormattable(v) ? v[format](ctx.formatter) : v)
                .flatMap((v, i, a) => [separators[Math.max(0, separators.length - (a.length - i))], v]);
            res.shift();
            return res.join('');
        };
    }
};
