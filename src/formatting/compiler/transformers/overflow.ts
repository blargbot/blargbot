import type { IValueResolverTransform } from '../types.js';

export const overflow: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        if (args.length !== 2)
            throw new Error('Overflow requires exactly 2 arguments: maxLength and overflowText');
        const maxLength = parseInt(args[0]);
        const overflowText = args[1];
        if (isNaN(maxLength))
            throw new Error('Maxlength must be a number');
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;

            if (typeof value !== 'string')
                throw new Error('Overflow expects value to be a string');

            if (value.length <= maxLength)
                return value;
            return value.slice(0, maxLength - overflowText.length) + overflowText;
        };
    }
};
