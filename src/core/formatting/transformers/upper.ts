import { IValueResolverTransform } from '../FormatStringCompiler';

export const upper: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        if (args.length !== 0)
            throw new Error('Upper needs no arguments');
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;

            if (typeof value !== 'string')
                throw new Error('Split can only apply to strings');
            return value.toLocaleUpperCase(ctx.formatter.locale.toString());
        };
    }
};
