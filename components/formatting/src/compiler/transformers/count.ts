import { toArray } from '../../util/index.js';
import { IValueResolverTransform } from '../types.js';

export const count: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        if (args.length !== 0)
            throw new Error('Count cannot accept args');
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            return toArray(value).length;
        };
    }
};
