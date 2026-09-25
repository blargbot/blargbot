import { createHash, getHashes } from 'node:crypto';

import { bbtagArray } from '../bbtagArray.js';
import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError, InvalidOperatorError } from '../BBTagRuntimeError.js';
import { cacheResult } from '../cacheResult.js';
import type { SubtagSignatureCallableOptions } from '../compilation/SubtagSignatureCallableOptions.js';
import { defineReplacer } from '../defineReplacer.js';
import type { LogicOperator } from '../operators.js';
import { aggregationOperators, isLogicOperator, logicOperators, numericOperators, ordinalOperators, runBool, stringOperators } from '../operators.js';
import { parse } from '../parse.js';
import type { SubtagReturnTypeMap } from '../types.js';
import type { ArgsLocals, BrainfuckLocals, DebugLocals, DecancerLocals, FallbackLocals, RegExpCompilerLocals, ReplaceOutputLocals, SafeRegExp, TemporalLocals, VariablesLocals } from './locals.js';

export const base64DecodeReplacer = defineReplacer(['base64Decode', 'aToB'], {
    parameters: ['text'],
    returns: 'string',
    execute: function base64Decode(_, [{ value: text }]) {
        return Buffer.from(text, 'base64').toString();
    }
});
export const base64EncodeReplacer = defineReplacer(['base64Encode', 'bToA'], {
    parameters: ['text'],
    returns: 'string',
    execute: function base64Encode(_, [{ value: text }]) {
        return Buffer.from(text).toString('base64');
    }
});
export const boolReplacer = defineReplacer('bool', {
    parameters: ['arg1', 'evaluator', 'arg2'],
    returns: 'boolean',
    execute: function bool(_, [{ value: left }, { value: operator }, { value: right }]) {
        return runBool(left, operator, right);
    }
});
export const brainfuckReplacer = defineReplacer<BrainfuckLocals>('brainfuck', {
    parameters: ['code', 'input?'],
    returns: 'string',
    execute: async function brainfuck(ctx, [{ value: code }, { value: input }]) {
        try {
            return await ctx.locals.brainfuck(code, input);
        } catch (error) {
            if (error instanceof Error)
                throw new BBTagRuntimeError(error.message);
            throw new BBTagRuntimeError('Unexpected error from brainfuck');
        }
    }
});
export const capitalizeReplacer = defineReplacer(
    'capitalize',
    {
        parameters: ['text'],
        returns: 'string',
        execute: function capitalize(_, [{ value: text }]) {
            return text.slice(0, 1).toUpperCase() + text.slice(1);
        }
    },
    {
        parameters: ['text', 'lower'],
        returns: 'string',
        execute: function capitalizeLower(_, [{ value: text }]) {
            return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
        }
    }
);
export const lowerReplacer = defineReplacer('lower', {
    parameters: ['text'],
    returns: 'string',
    execute: function lower(_, [{ value: text }]) {
        return text.toLowerCase();
    }
});
export const upperReplacer = defineReplacer('upper', {
    parameters: ['text'],
    returns: 'string',
    execute: function upper(_, [{ value: text }]) {
        return text.toUpperCase();
    }
});
export const chooseReplacer = defineReplacer('choose', {
    parameters: ['choice', '~options+'],
    returns: 'string',
    execute: function choose(_, [{ value: choice }, ...options]) {
        const index = parse.int(choice, { throw: true });
        if (index < 0)
            throw new BBTagRuntimeError('Choice cannot be negative');
        if (index >= options.length)
            throw new BBTagRuntimeError('Index out of range');

        return options[index].wait();
    }
});
export const cleanReplacer = defineReplacer('clean', {
    parameters: ['text'],
    returns: 'string',
    execute: function clean(_, [{ value: text }]) {
        return text.replace(/\s+/g, (match) => {
            if (match.includes('\n')) return '\n';
            if (match.includes('\t')) return '\t';
            return match[0];
        });
    }
});
export const commentReplacer = defineReplacer(['comment', '//'], {
    parameters: ['~anything*'],
    returns: 'nothing',
    execute: function comment() { }
});
export const voidReplacer = defineReplacer(['void', 'null'], {
    parameters: ['anything*'],
    returns: 'nothing',
    execute: function $void() { }
});
export const escapeBBTagReplacer = defineReplacer(['escapeBBTag', 'escape'], {
    parameters: ['~input*'],
    returns: 'string',
    execute: function escape(_, items) {
        return items.map(i => i.code.source).join(';');
    }
});
const supportedHashes = new Set(['md5', 'sha1', 'sha256', 'sha512', 'whirlpool']).intersection(new Set(getHashes()));
export const hashReplacer = defineReplacer(
    'hash',
    {
        parameters: ['text'],
        returns: 'number',
        execute: function weakHash(_, [{ value: text }]) {
            return text.split('')
                .reduce(function (a, b) {
                    a = (a << 5) - a + b.charCodeAt(0);
                    return a & a;
                }, 0);
        }
    },
    {
        parameters: ['algorithm', 'text'],
        returns: 'string',
        execute: function strongHash(_, [{ value: algorithm }, { value: text }]) {
            if (!supportedHashes.has(algorithm.toLowerCase()))
                throw new BBTagRuntimeError('Unsupported hash', `${algorithm} is not a supported hash algorithm`);

            const data = text.startsWith('buffer:') ? Buffer.from(text.slice(7), 'base64')
                : text.startsWith('text:') ? Buffer.from(text.slice(5))
                    : Buffer.from(text);

            const hash = createHash(algorithm.toLowerCase());
            return hash.update(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)).digest('hex');
        }
    }
);
export const indexOfReplacer = defineReplacer<FallbackLocals>('indexOf', {
    parameters: ['text|array', 'searchfor', 'start?:0'],
    returns: 'number',
    execute: function indexOf(ctx, [{ value: text }, { value: search }, { value: start }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const from = parse.int(start, { fallback, throw: true });

        const { v: input } = bbtagArray.deserialize(text) ?? { v: text };
        return input.indexOf(search, from);
    }
});
export const langReplacer = defineReplacer('lang', {
    parameters: ['language'],
    returns: 'nothing',
    execute: function lang() { }
});
export const lengthReplacer = defineReplacer('length', {
    parameters: ['value'],
    returns: 'number',
    execute: function length(_, [{ value }]) {
        const deserializedArray = bbtagArray.deserialize(value);
        if (deserializedArray !== undefined)
            return deserializedArray.v.length;
        return value.length;
    }
});
export const logicReplacer = defineReplacer('logic', {
    parameters: ['operator', 'values+'],
    returns: 'boolean',
    execute: function logic(_, args) {
        let operator: LogicOperator | undefined;
        const values = args.map(x => x.value);

        for (let i = 0; i < values.length; i++) {
            const operatorName = values[i].toLowerCase();
            if (isLogicOperator(operatorName))
                operator = operatorName;
            else if (operatorName === '^')
                operator = 'xor';
            else
                continue;
            values.splice(i, 1);
            break;
        }

        if (operator === undefined)
            throw new InvalidOperatorError(values[0]);

        const parsed = values.map((value) => parse.boolean(value, { throw: true }));

        return logicOperators[operator](parsed);
    }
});
export const md5Replacer = defineReplacer('md5', {
    parameters: ['text'],
    returns: 'string',
    execute: function md5(_, [{ value: text }]) {
        const hash = createHash('md5');
        return hash.update(text).digest('hex');
    }
});
export const newlineReplacer = defineReplacer<FallbackLocals>(['newline', 'n'], {
    parameters: ['count?:1'],
    returns: 'string',
    execute: function newline(ctx, [{ value: countStr }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const count = parse.int(countStr, { throw: true, fallback });
        // TODO: limit count
        return ''.padStart(count < 0 ? 0 : count, '\n');
    }
});
export const spaceReplacer = defineReplacer<FallbackLocals>(['space', 's'], {
    parameters: ['count?:1'],
    returns: 'string',
    execute: function space(ctx, [{ value: countStr }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const count = parse.int(countStr, { throw: true, fallback });
        // TODO: limit count
        return ''.padStart(count < 0 ? 0 : count, ' ');
    }
});
type Options<Type extends keyof SubtagReturnTypeMap> = SubtagSignatureCallableOptions<object, Type>;
function withName<T extends (...args: never) => unknown>(name: string, fn: T): T {
    return Object.defineProperty(fn, 'name', { value: name });
}
export const operatorReplacer = defineReplacer('operator',
    ...Object.entries(ordinalOperators).map<Options<'boolean'>>(([op, impl]) => ({
        subtagName: op,
        parameters: ['values+'],
        returns: 'boolean',
        execute: withName(op, (_, values) => {
            const flattenedValues = bbtagArray.flattenArray(values.map(x => x.value))
                .map(v => parse.string(v));
            return flattenedValues.length > 1 && flattenedValues
                .values()
                .drop(1)
                .every((v, i) => impl(flattenedValues[i], v));
        })
    })),
    ...Object.entries(stringOperators).map<Options<'boolean'>>(([op, impl]) => ({
        subtagName: op,
        parameters: ['values+'],
        returns: 'boolean',
        execute: withName(op, (_, [arg0, ...args]) => args
            .values()
            .every(v => impl(arg0.value, v.value))
        )
    })),
    ...Object.entries(logicOperators).map<Options<'boolean'>>(([op, impl]) => ({
        subtagName: op,
        parameters: ['values+'],
        returns: 'boolean',
        execute: withName(op, (_, args) => impl(args
            .map((arg) => parse.boolean(arg.value, { throw: true }))
        ))
    })),
    ...Object.entries(numericOperators).map<Options<'number'>>(([op, impl]) => ({
        subtagName: op,
        parameters: ['values+'],
        returns: 'number',
        execute: withName(op, (_, values) => bbtagArray
            .flattenArray(values.map(v => v.value))
            .values()
            .map(arg => parse.float(arg, { throw: true }))
            .reduce(impl)
        )
    })),
    ...Object.entries(aggregationOperators).map<Options<'string'>>(([op, impl]) => ({
        subtagName: op,
        parameters: ['values+'],
        returns: 'string',
        execute: withName(op, (_, values) => impl(bbtagArray
            .flattenArray(values.map(x => x.value))
            .map(parse.string)
        ))
    })),
    {
        parameters: ['values+'],
        returns: 'error',
        execute: function invalidOperator(_, values) {
            throw new InvalidOperatorError(values.subtagName);
        }
    }
);
export const padReplacer = defineReplacer('pad', {
    parameters: ['direction', 'back', 'text'],
    returns: 'string',
    execute: function pad(_, [{ value: direction }, { value: backing }, { value: overlay }]) {
        switch (direction.toLowerCase()) {
            case 'left': {
                if (overlay.length > backing.length)
                    return overlay;
                return backing.slice(0, backing.length - overlay.length) + overlay;
            }
            case 'right': {
                if (overlay.length > backing.length)
                    return overlay;
                return overlay + backing.slice(overlay.length);
            }
        }
        throw new BBTagRuntimeError('Invalid direction');
    }
});
export const realPadReplacer = defineReplacer(
    'realPad',
    {
        parameters: ['text', 'length'],
        returns: 'string',
        execute: function realPad(_, [{ value: text }, { value: lengthStr }]) {
            const length = parse.int(lengthStr, { throw: true });
            return text.padEnd(length, ' ');
        }
    },
    {
        parameters: ['text', 'length', 'filler: ', 'direction?:right'],
        returns: 'string',
        execute: function realPaddFull(_, [{ value: text }, { value: lengthStr }, { value: filler }, { value: direction }]) {
            const length = parse.int(lengthStr, { throw: true });
            if (filler.length === 0)
                filler = '';
            else if (filler.length !== 1)
                throw new BBTagRuntimeError('Filler must be 1 character');
            switch (direction) {
                case 'left':
                case 'start':
                    return text.padStart(length, filler);
                case 'right':
                case 'end':
                    return text.padEnd(length, filler);
                default:
                    throw new BBTagRuntimeError('Invalid direction', `${direction} is invalid`);
            }
        }
    }
);
function pickOneOf<T>(source: readonly T[]): T {
    return source[Math.floor(Math.random() * source.length)];
}
export const randomChooseReplacer = defineReplacer<VariablesLocals & ArgsLocals>(
    ['randomChoose', 'randChoose'],
    {
        parameters: ['choiceArray'],
        returns: 'json',
        execute: async function randomChooseArray(ctx, [{ value: choices }]) {
            const array = await bbtagArray.deserializeOrGetArray(ctx, choices);
            if (array === undefined)
                return choices;
            if (array.v.length === 0)
                return '';
            return pickOneOf(array.v);
        }
    },
    {
        parameters: ['~choices+2'],
        returns: 'string',
        execute: async function randomChooseArray(_, array) {
            return await pickOneOf(array).wait();
        }
    }
);
export const randomStringReplacer = defineReplacer<FallbackLocals>(['randomString', 'randStr', 'randString'], {
    parameters: ['chars', 'length'],
    returns: 'string',
    execute: function randomString(ctx, [{ value: charsStr }, { value: countStr }]) {
        const chars = charsStr.split('');
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const count = parse.int(countStr, { fallback, throw: true });
        if (chars.length === 0)
            throw new BBTagRuntimeError('Not enough characters');

        // TODO: count should be limited here
        return Array.from({ length: count }, () => pickOneOf(chars)).join('');
    }
});
async function parseRegExp(context: BBTagContext<RegExpCompilerLocals>, regExp: string): Promise<SafeRegExp> {
    if (regExp.startsWith('/'))
        regExp = regExp.slice(1);
    const flagsStartAt = regExp.lastIndexOf('/');
    if (flagsStartAt === -1)
        throw new BBTagRuntimeError('Invalid Regex');
    for (let i = flagsStartAt - 1; i >= 0; i -= 2) {
        if (regExp[i] !== '\\')
            break;
        if (regExp[i - 1] !== '\\')
            throw new BBTagRuntimeError('Invalid Regex');
    }

    const body = regExp.slice(0, flagsStartAt);
    const flags = new Set(regExp.slice(flagsStartAt + 1));
    if (body.length > 2000)
        throw new BBTagRuntimeError('Regex too long');
    if (flags.difference(new Set('igmsuy')).size > 0)
        throw new BBTagRuntimeError('Invalid Regex');

    try {
        return await context.locals.compileRegExp(body, [...flags].join(''));
    } catch (error) {
        if (error instanceof Error)
            throw new BBTagRuntimeError(error.message);
        throw error;
    }
}
export const regexMatchReplacer = defineReplacer<RegExpCompilerLocals>(['regexMatch', 'match'], {
    parameters: ['text', '~regex'],
    returns: 'string[]',
    execute: async function regexMatch(ctx, [{ value: text }, { raw: source }]) {
        const regex = await parseRegExp(ctx, source);
        return await regex.match(text);
    }
});
export const regexReplaceReplacer = defineReplacer<RegExpCompilerLocals & ReplaceOutputLocals>(
    'regexReplace',
    {
        parameters: ['~regex', 'replaceWith'],
        returns: 'nothing',
        execute: async function regexReplaceOutput(ctx, [{ raw: source }, { value: replaceWith }]) {
            const regex = await parseRegExp(ctx, source);
            ctx.locals.replaceOutput.push(text => regex.replace(text, replaceWith));
        }
    },
    {
        parameters: ['text', '~regex', 'replaceWith'],
        returns: 'string',
        execute: async function regexReplaceValue(ctx, [{ value: text }, { raw: source }, { value: replaceWith }]) {
            const regex = await parseRegExp(ctx, source);
            return await regex.replace(text, replaceWith);
        }
    }
);
export const regexSplitReplacer = defineReplacer<RegExpCompilerLocals>('regexSplit', {
    parameters: ['text', '~regex'],
    returns: 'string[]',
    execute: async function regexSplit(ctx, [{ value: text }, { raw: source }]) {
        const regex = await parseRegExp(ctx, source);
        return await regex.split(text);
    }
});
export const regexTestReplacer = defineReplacer<RegExpCompilerLocals>('regexTest', {
    parameters: ['text', '~regex'],
    returns: 'boolean',
    execute: async function regexTest(ctx, [{ value: text }, { raw: source }]) {
        const regex = await parseRegExp(ctx, source);
        return await regex.test(text);
    }
});
export const replaceReplacer = defineReplacer<ReplaceOutputLocals>(
    'replace',
    {
        parameters: ['phrase', 'replaceWith'],
        returns: 'nothing',
        execute: function replaceOutput(ctx, [{ value: phrase }, { value: replaceWith }]) {
            ctx.locals.replaceOutput.push(text => text.replace(phrase, replaceWith));
        }
    },
    {
        parameters: ['text', 'phrase', 'replaceWith'],
        returns: 'string',
        execute: function replaceValue(_, [{ value: text }, { value: phrase }, { value: replaceWith }]) {
            return text.replace(phrase, replaceWith);
        }
    }
);
export const reverseReplacer = defineReplacer<VariablesLocals>('reverse', {
    parameters: ['text'],
    returns: 'string',
    execute: async function reverse(ctx, [{ value: text }]) {
        const arr = bbtagArray.deserialize(text);
        if (arr === undefined)
            return text.split('').reverse().join('');

        arr.v = arr.v.reverse();
        if (arr.n === undefined)
            return bbtagArray.serialize(arr.v);

        await ctx.locals.variables.set(arr.n, arr.v);
        return '';
    }
});
export const substringReplacer = defineReplacer<FallbackLocals>('substring', {
    parameters: ['text', 'start', 'end?'],
    returns: 'string',
    execute: function substringReplacer(ctx, [{ value: text }, { value: startStr }, { value: endStr }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const start = parse.int(startStr, { fallback, throw: true });
        const end = endStr === '' ? text.length : parse.int(endStr, { fallback, throw: true });
        return text.substring(start, end);
    }
});
export const trimReplacer = defineReplacer('trim', {
    parameters: ['text'],
    returns: 'string',
    execute: function trim(_, [{ value: text }]) {
        return text.trim();
    }
});
export const unindentReplacer = defineReplacer(['unindent', 'ui'], {
    parameters: ['text', 'level?'],
    returns: 'string',
    execute: function unindent(_, [{ value: text }, { value: levelStr }]) {
        let level = parse.int(levelStr);
        if (level === undefined) {
            const lines = text.split('\n');
            level = lines.length === 1 ? 0 : lines
                .values()
                .drop(1)
                .map(l => l.match(/^ */)![0].length)
                .reduce((p, c) => Math.min(p, c));
        }
        if (level === 0)
            return text;

        const regexp = new RegExp(`^ {1,${level}}`, 'gm');
        return text.replace(regexp, '');
    }
});
export const uriEncodeReplacer = defineReplacer('uriEncode', {
    parameters: ['text'],
    returns: 'string',
    execute: function uriEncode(_, [{ value: text }]) {
        return encodeURIComponent(text);
    }
});
export const uriDecodeReplacer = defineReplacer('uriDecode', {
    parameters: ['text'],
    returns: 'string',
    execute: function uriDecode(_, [{ value: text }]) {
        try {
            return decodeURIComponent(text);
        } catch (error) {
            if (error instanceof Error)
                throw new BBTagRuntimeError(error.message);
            throw error;
        }
    }
});
export const timeReplacer = defineReplacer<TemporalLocals>('time', {
    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'time?:now', 'parseFormat?', 'fromTimezone?:Etc/UTC', 'toTimezone?:Etc/UTC'],
    returns: 'string',
    execute: function time(ctx, [{ value: format }, { value: time }, { value: parseFormat }, { value: fromTimezone }, { value: toTimezone }]) {
        const parsed = ctx.locals.parseTime(time, parseFormat, fromTimezone);
        if (parsed === undefined)
            throw new BBTagRuntimeError('Invalid date');
        return parsed.toString(format, toTimezone);
    }
});
export const decancerReplacer = defineReplacer<DecancerLocals>('decancer', {
    parameters: ['text'],
    returns: 'string',
    execute: function decancer(ctx, [{ value: text }]) {
        return ctx.locals.decancer(text);
    }
});
export const fallbackReplacer = defineReplacer<FallbackLocals>(
    'fallback',
    {
        parameters: ['message'],
        returns: 'nothing',
        execute: function setFallback(ctx, [{ value: message }]) { ctx.locals.fallback = message; }
    },
    {
        parameters: [],
        returns: 'nothing',
        execute: function clearFallback(ctx) { ctx.locals.fallback = undefined; }
    }
);
export const debugReplacer = defineReplacer<DebugLocals>('debug', {
    parameters: ['text*'],
    returns: 'nothing',
    execute: function debug(ctx, text, bbtag) {
        ctx.locals.debug.push({
            bbtag,
            text: text.map(x => x.value).join(' ')
        });
    }
});
