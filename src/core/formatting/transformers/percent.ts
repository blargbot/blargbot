import { IValueResolverTransform } from '../FormatStringCompiler';

export const percent: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        let precision = 2;
        switch (args.length) {
            case 0: break;
            case 1:
                precision = parseInt(args[0]);
                break;
            default: throw new Error(`Percent accepts up to 1 value`);
        }
        if (isNaN(precision))
            throw new Error(`Precision must be a number`);

        const mult = Math.pow(10, precision + 2);
        const div = Math.pow(10, precision);

        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            if (typeof value !== `number`)
                throw new Error(`Value must be a number`);
            return `${Math.round(value * mult) / div}%`;
        };
    }
};
