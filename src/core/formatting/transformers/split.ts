import { IValueResolverTransform } from '../FormatStringCompiler';

export const split: IValueResolverTransform = {
    transform(_compiler, source, ...separators) {
        if (separators.length === 0)
            throw new Error(`A separator must be provided`);
        const separator = separators.join(`|`);
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;

            if (typeof value !== `string`)
                throw new Error(`Split can only apply to strings`);
            return value.split(separator);
        };
    }
};
