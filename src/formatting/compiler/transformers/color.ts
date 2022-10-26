import { IValueResolverTransform } from '../types';

export const color: IValueResolverTransform = {
    transform(_compiler, source) {
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            if (typeof value !== 'number')
                throw new Error('Value must be a number');
            return value.toString(16).padStart(6, '0');
        };
    }
};
