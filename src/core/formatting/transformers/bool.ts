import { IValueResolverTransform } from '../FormatStringCompiler';

export const bool: IValueResolverTransform = {
    transform(compiler, source, ...results) {
        switch (results.length) {
            case 0: throw new Error(`Bool requires a template`);
            case 1:
            case 2: break;
            default: throw new Error(`Bool cannot accept more than 2 templates`);
        }
        const truthy = compiler.compile(results[0]);
        const falsy = results.length === 1 ? () => undefined : compiler.compile(results[1]);
        return ctx => {
            const value = source(ctx);
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            ctx.withValue(value, value ? truthy : falsy);
        };
    }
};
