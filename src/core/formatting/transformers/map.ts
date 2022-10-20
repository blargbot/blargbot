import { IValueResolverTransform } from "../FormatStringCompiler";
import { toArray } from "./_toArray";

export const map: IValueResolverTransform = {
    transform(compiler, source, ...args) {
        switch (args.length) {
            case 0: throw new Error(`Map requires a template`);
            case 1: args = [args.join(`|`)];
        }
        const formatter = compiler.compile(args[0]);
        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            return toArray(value).map(v => ctx.withValue(v, formatter));
        };
    }
};
