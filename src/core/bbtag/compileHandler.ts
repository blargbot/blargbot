import { getRange, parse } from '../../utils';
import { SubtagHandlerDefintion, SubtagHandler, SubtagSignatureHandler, SubtagArgument } from './types';

export function compileHandler(definition: SubtagHandlerDefintion): SubtagHandler {
    return {
        execute: compileDefinition(definition)
    };
}

function compileDefinition(definition: SubtagHandlerDefintion): SubtagHandler['execute'] {
    const tests: Array<{ test: (argCount: number) => boolean, handler: SubtagSignatureHandler }> = [];
    let minCount = Number.MAX_VALUE;
    let maxCount = 0;

    if ('whenArgCount' in definition) {
        for (const test of Object.keys(definition.whenArgCount)) {
            const handler = definition.whenArgCount[test];
            const counts = computeArgCounts(test);
            minCount = Math.min(minCount, counts[1]);
            maxCount = Math.max(maxCount, counts[2]);
            tests.push({ test: counts[0], handler: toFullHandler(handler) });
        }
    }

    const fallback = 'default' in definition
        ? toFullHandler(definition.default)
        : missingHandler;

    if (!('default' in definition)) {
        tests.push({ test: c => c < minCount, handler: notEnoughArgs });
        tests.push({ test: c => c > maxCount, handler: tooManyArgs });
    }

    return async (context, subtag) => {
        const argCount = subtag.args.length;
        const handler = tests.find(t => t.test(argCount))?.handler ?? fallback;
        const args = subtag.args.map<SubtagArgument>(arg => {
            let promise: Promise<string> | undefined;
            let value: string | undefined;
            return {
                raw: arg,
                get isCached() { return promise !== undefined; },
                wait(skipCache = false) {
                    if (skipCache) { promise = undefined; }
                    return promise ??= context.eval(arg).then(v => value = v);
                },
                get value() {
                    if (value === undefined)
                        throw new Error('Cannot syncronously access an unresolved variable. Use \'.wait()\' to get the value asyncronously first');
                    return value;
                }
            };
        });

        const resolve = handler.resolve === false ? [] : handler.resolve ?? getRange(0, subtag.args.length);
        await Promise.all(resolve.map(i => args[i]?.wait()));
        return await handler.execute(context, args, subtag);
    };
}

function toFullHandler(handler: SubtagSignatureHandler | SubtagSignatureHandler['execute']): SubtagSignatureHandler {
    return typeof handler === 'function' ? { execute: handler } : handler;
}

function computeArgCounts(condition: string): [test: (argCount: number) => boolean, min: number, max: number] {
    condition = condition.replace(/\s+/g, '');
    let match: RegExpExecArray | null;
    if (match = /^(?<operator><={0,2}|>={0,2}|!={0,2}|={0,3})(?<value>\d+)$/.exec(condition)) {
        const { value: valueRaw, operator } = match.groups ?? {};
        const value = parse.int(valueRaw);
        switch (operator) {
            case '<': return [c => c < value, 0, value - 1];
            case '<=':
            case '<==': return [c => c <= value, 0, value];

            case '>': return [c => c > value, value + 1, Number.MAX_VALUE];
            case '>=':
            case '>==': return [c => c >= value, value, Number.MAX_VALUE];

            case '!':
            case '!=':
            case '!==': return [c => c !== value, 0, Number.MAX_VALUE];

            case '':
            case '=':
            case '==':
            case '===': return [c => c === value, value, value];
            default: throw new Error('Regex matched an operator, but wasnt handled by the switch');
        }
    }
    if (match = /^(?<from>\d+)-(?<to>\d+)$/.exec(condition)) {
        const { from: fromRaw, to: toRaw } = match.groups ?? {};
        let from = parse.int(fromRaw);
        let to = parse.int(toRaw);
        if (from > to) [from, to] = [to, from];
        return [c => from <= c && c <= to, from, to];
    }
    if (match = /^\d+(?:,\d+)+$/.exec(condition)) {
        const values = new Set(condition.split(',').map(v => parse.int(v)));
        return [c => values.has(c), Math.min(...values), Math.max(...values)];
    }
    if (match = /^%(?<mod>\d+)(?<offset>[+-]?\d+)?/.exec(condition)) {
        const { mod: modRaw, offset: offsetRaw = '0' } = match.groups ?? {};
        const mod = parse.int(modRaw);
        const offset = parse.int(offsetRaw);
        return [c => (c + offset) % mod === 0, 0, Number.MAX_VALUE];
    }
    throw new Error(`Unable to interpret '${condition}' as an arglength condition expression`);
}

const notEnoughArgs: SubtagSignatureHandler = {
    resolve: false,
    execute: (ctx, _, subtag) => ctx.addError('Not enough arguments', subtag)
};

const tooManyArgs: SubtagSignatureHandler = {
    resolve: false,
    execute: (ctx, _, subtag) => ctx.addError('Too many arguments', subtag)
};
const missingHandler: SubtagSignatureHandler = {
    resolve: false,
    execute: (_, __, subtag) => { throw new Error(`Missing a handler when there are ${subtag.args.length} arguments!`); }
};