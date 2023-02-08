import { toArray } from '../../util/index.js';
import type { ReplacementContext } from '../ReplacementContext.js';
import type { IValueResolverTransform } from '../types.js';

export const plural: IValueResolverTransform = {
    transform(compiler, source, ...cases) {
        const otherStr = cases.pop();
        if (otherStr === undefined)
            throw new Error('Must provide the other case as the last case');
        const other = compiler.compile(otherStr);
        const lookup: {
            [P in string]?: (context: ReplacementContext) => string;
        } = {};
        for (const c of cases) {
            const match = c.match(/^(\d+|<|>):(.*)$/);
            if (match === null)
                throw new Error('Plural arg must start with a number, < or > and a :');
            if (match[1] in lookup)
                throw new Error(`Duplicate arg found for ${match[1]}`);
            lookup[match[1]] = compiler.compile(match[2]);
        }

        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            return ctx.withValue(value, ctx => {
                const count = typeof value === 'number' ? value : toArray(value).length;
                switch (new Intl.PluralRules(ctx.formatter.locale.toString()).select(count)) {
                    case 'zero': return (lookup[count] ?? lookup[0] ?? other)(ctx);
                    case 'one': return (lookup[count] ?? lookup[1] ?? other)(ctx);
                    case 'two': return (lookup[count] ?? lookup[2] ?? other)(ctx);
                    case 'few': return (lookup[count] ?? lookup['<'] ?? other)(ctx);
                    case 'many': return (lookup[count] ?? lookup['>'] ?? other)(ctx);
                    case 'other': return (lookup[count] ?? other)(ctx);
                }
            });
        };
    }
};
