import { bbtagArray } from '../bbtagArray.js';
import { BBTagRuntimeError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { runBool } from '../operators.js';
import { parse } from '../parse.js';

export const throwReplacer = defineReplacer('throw', {
    parameters: ['error?:A custom error occurred'],
    returns: 'error',
    execute: function $throw(_, [{ value: error }]) {
        throw new BBTagRuntimeError(error, 'A user defined error');
    }
});
export const returnReplacer = defineReplacer('return', {
    parameters: ['force?:true'],
    returns: 'nothing',
    execute: function $return(context, [{ value: forcedStr }]) {
        const forced = parse.boolean(forcedStr, { fallback: true });
        context.returnDepth = forced ? Infinity : 1;
    }
});

export const ifReplacer = defineReplacer(
    'if',
    {
        parameters: ['boolean', '~then'],
        returns: 'string',
        execute: async function ifThen(_, [{ value: bool }, thenCode]) {
            if (!parse.boolean(bool, { throw: true }))
                return '';

            return await thenCode.wait();
        }
    },
    {
        parameters: ['boolean', '~then', '~else'],
        returns: 'string',
        execute: async function ifThenElse(_, [{ value: bool }, thenCode, elseCode]) {
            const next = parse.boolean(bool, { throw: true }) ? thenCode : elseCode;
            return await next.wait();
        }
    },
    {
        parameters: ['value1', 'operator', 'value2', '~then'],
        returns: 'string',
        execute: async function ifOperatorThen(_, [{ value: value1 }, { value: operator }, { value: value2 }, thenCode]) {
            if (!runBool(value1, operator, value2))
                return '';
            return await thenCode.wait();
        }
    },
    {
        parameters: ['value1', 'operator', 'value2', '~then', '~else'],
        returns: 'string',
        execute: async function ifOperatorThenElse(_, [{ value: value1 }, { value: operator }, { value: value2 }, thenCode, elseCode]) {
            const next = runBool(value1, operator, value2) ? thenCode : elseCode;
            return await next.wait();
        }
    }
);
export const switchReplacer = defineReplacer('switch', {
    parameters: ['value', { repeat: ['case', '~then'], minCount: 1 }, '~default?'],
    returns: 'string',
    execute: async function $switch(_, [{ value }, ...args]) {
        let defaultCase = undefined;
        if (args.length % 2 === 1)
            defaultCase = args.pop();

        const pairs = Array.from(
            { length: args.length / 2 },
            (_, i) => [args[i * 2].value, args[i * 2 + 1]] as const
        );
        const cases = new Map(pairs
            .reverse()
            .flatMap(x => (bbtagArray.deserialize(x[0])?.v ?? [x[0]])
                .reverse()
                .map(v => [parse.string(v), x[1]] as const)
            )
        );
        const match = cases.get(value) ?? defaultCase;
        if (match === undefined)
            return '';

        return await match.execute();
    }
});
