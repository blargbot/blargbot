import { IValueResolverTransform } from '../FormatStringCompiler';

export const bytes: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        if (args.length !== 0)
            throw new Error(`Bytes cannot accept args`);
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            if (typeof value !== `number`)
                throw new Error(`Bytes must be a number!`);
            const i = value === 0 ? 0 : Math.floor(Math.log(value) / Math.log(1024));
            return `${(value / Math.pow(1024, i)).toFixed(2)} ${[`B`, `kB`, `MB`, `GB`, `TB`][i]}`;
        };
    }
};
