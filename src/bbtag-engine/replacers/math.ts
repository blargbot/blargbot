import { bbtagArray } from '../bbtagArray.js';
import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError, InvalidOperatorError } from '../BBTagRuntimeError.js';
import { cacheResult } from '../cacheResult.js';
import { defineReplacer } from '../defineReplacer.js';
import { isNumericOperator, numericOperators } from '../operators.js';
import { parse } from '../parse.js';
import type { FallbackLocals, VariablesLocals } from './locals.js';

export const parseIntReplacer = defineReplacer('parseInt', {
    parameters: ['number'],
    returns: 'number',
    execute: function parseInt(_, [number]) {
        return parse.int(number.value) ?? NaN;
    }
});
export const parseFloatReplacer = defineReplacer('parseFloat', {
    parameters: ['number'],
    returns: 'number',
    execute: function parseFloat(_, [number]) {
        return parse.float(number.value) ?? NaN;
    }
});
export const roundReplacer = defineReplacer('round', {
    parameters: ['number'],
    returns: 'number',
    execute: function round(_, [number]) {
        return roundUsing(number.value, Math.round);
    }
});
export const roundDownReplacer = defineReplacer(['roundDown', 'floor'], {
    parameters: ['number'],
    returns: 'number',
    execute: function roundDown(_, [number]) {
        return roundUsing(number.value, Math.floor);
    }
});
export const roundUpReplacer = defineReplacer(['roundUp', 'ceil'], {
    parameters: ['number'],
    returns: 'number',
    execute: function roundUp(_, [number]) {
        return roundUsing(number.value, Math.ceil);
    }
});
export const randomIntReplacer = defineReplacer<FallbackLocals>(['randomInt', 'randint'], {
    parameters: ['min?:0', 'max'],
    returns: 'number',
    execute: function randomInt(ctx, [{ value: minStr }, { value: maxStr }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const min = parse.int(minStr, { fallback, throw: true });
        const max = parse.int(maxStr, { fallback, throw: true });
        return min + Math.floor(Math.random() * (max - min));
    }
});
export const absoluteReplacer = defineReplacer(
    ['absolute', 'abs'],
    {
        parameters: ['number'],
        returns: 'number|number[]',
        execute: function absolute(_, [value]) {
            const result = absMultiple([value.value]);
            if (result.length === 1)
                return result[0];
            return result;
        }
    },
    {
        parameters: ['numbers+2'],
        returns: 'number[]',
        execute: function absoluteArray(_, values) {
            return absMultiple(values.map(arg => arg.value));
        }
    }
);
export const decrementReplacer = defineReplacer<VariablesLocals>(
    'decrement',
    {
        parameters: ['varName'],
        returns: 'number',
        execute: function decrement(ctx, [{ value }]) {
            return nudge(ctx, value, '1', 'true', -1);
        }
    },
    {
        parameters: ['varName', 'amount:1', 'floor?:true'],
        returns: 'number',
        execute: function decrementFloor(ctx, [varName, amount, floor]) {
            return nudge(ctx, varName.value, amount.value, floor.value, -1);
        }
    }
);
export const incrementReplacer = defineReplacer<VariablesLocals>(
    'increment',
    {
        parameters: ['varName'],
        returns: 'number',
        execute: function increment(ctx, [{ value }]) {
            return nudge(ctx, value, '1', 'true', 1);
        }
    },
    {
        parameters: ['varName', 'amount:1', 'floor?:true'],
        returns: 'number',
        execute: function incrementFloor(ctx, [varName, amount, floor]) {
            return nudge(ctx, varName.value, amount.value, floor.value, 1);
        }
    }
);
export const numberFormatReplacer = defineReplacer(
    ['numberFormat', 'numFormat'],
    {
        parameters: ['number', 'roundTo'],
        returns: 'string',
        execute: function numberFormat(_, [numberStr, roundToStr]) {
            return numFormat(numberStr.value, roundToStr.value, '.', '');
        }
    },
    {
        parameters: ['number', 'roundTo', 'decimal:.', 'thousands?:'],
        returns: 'string',
        execute: function numberFormatWithDecimal(_, [numberStr, roundToStr, decimal, thousands]) {
            return numFormat(numberStr.value, roundToStr.value, decimal.value, thousands.value);
        }
    }
);
export const mathReplacer = defineReplacer('math', {
    parameters: ['operator', 'numbers+'],
    returns: 'number',
    execute: function math(_, [{ value: operator }, ...values]) {
        if (!isNumericOperator(operator))
            throw new InvalidOperatorError(operator);

        return bbtagArray.flattenArray(values.map(v => v.value))
            .map(arg => parse.float(arg, { throw: true }))
            .reduce(numericOperators[operator]);
    }
});
export const maxReplacer = defineReplacer('max', {
    parameters: ['numbers+'],
    returns: 'number',
    execute: function max(_, values) {
        return aggregate(values.map(v => v.value), v => Math.max(...v));
    }
});
export const minReplacer = defineReplacer('min', {
    parameters: ['numbers+'],
    returns: 'number',
    execute: function min(_, values) {
        return aggregate(values.map(v => v.value), v => Math.min(...v));
    }
});
export const baseReplacer = defineReplacer<FallbackLocals>(['base', 'radix'], {
    parameters: ['integer', 'origin?:10', 'radix'],
    returns: 'string',
    execute: function base(ctx, [{ value: valueStr }, { value: originStr }, { value: radixStr }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        let origin = parse.int(originStr, { fallback, throw: true });
        let radix = parse.int(radixStr, { fallback, throw: true });
        if (!isValidRadix(origin))
            origin = fallback() ?? origin;
        if (!isValidRadix(radix))
            radix = fallback() ?? radix;
        if (!isValidRadix(origin) || !isValidRadix(radix))
            throw new BBTagRuntimeError('Base must be between 2 and 36');

        return parse.int(valueStr, { fallback, throw: true, radix: origin }).toString(radix);
    }
});

function isValidRadix(value: number): value is number {
    return value >= 2 && value <= 36;
}

function roundUsing(value: string, roundFn: (value: number) => number): number {
    return roundFn(parse.float(value, { throw: true }));
}

function absMultiple(values: string[]): number[] {
    return bbtagArray.flattenArray(values)
        .map(s => parse.float(s, { throw: true }))
        .map(Math.abs);
}
async function nudge(context: BBTagContext<VariablesLocals>, varName: string, amountStr: string, floorStr: string, scale: -1 | 1): Promise<number> {
    let amount = parse.float(amountStr, { throw: true });
    const floor = parse.boolean(floorStr, { throw: true });

    const varRef = await context.locals.variables.get(varName);
    let value = parse.float(varRef.value, { throw: true });
    if (floor) {
        value = Math.floor(value);
        amount = Math.floor(amount);
    }

    value += amount * scale;
    await context.locals.variables.set(varName, value);

    return value;
}
function aggregate(values: string[], aggregator: (v: number[]) => number): number {
    const flattenedArgs = bbtagArray.flattenArray(values);
    const parsedArgs = [];
    for (const arg of flattenedArgs) {
        if (typeof arg !== 'string' && typeof arg !== 'number')
            return NaN;
        const parsed = parse.float(arg);
        if (parsed === undefined)
            return NaN;
        parsedArgs.push(parsed);
    }

    return aggregator(parsedArgs);
}
function numFormat(
    numberStr: string,
    roundToStr: string,
    decimal: string,
    thousands: string
): string {
    const number = parse.float(numberStr);
    if (number === undefined)
        return 'NaN';
    let roundto = parse.int(roundToStr);
    const options: Intl.NumberFormatOptions = {}; // create formatter options
    if (roundto !== undefined) {
        roundto = Math.min(20, Math.max(-21, roundto));
        const trunclen = Math.trunc(number).toString().length;
        if (roundto >= 0) {
            options.minimumFractionDigits = roundto;
            options.maximumFractionDigits = roundto;
        } else if (trunclen + roundto >= 0) {
            options.maximumSignificantDigits = trunclen + roundto;
        }
    }
    let num: string | string[] = number.toLocaleString('en-US', options).split('.');
    num[0] = num[0].split(',').join(thousands);
    num = num.join(decimal);
    return num;
}
