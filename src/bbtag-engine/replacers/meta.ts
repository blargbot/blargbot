import { bbtagArray } from '../bbtagArray.js';
import { BBTagRuntimeError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';

export const subtagExistsReplacer = defineReplacer('subtagExists', {
    parameters: ['subtag'],
    returns: 'boolean',
    execute: function subtagExists(ctx, [subtag]) {
        return ctx.canReplace(subtag.value);
    }
});

export const applyReplacer = defineReplacer('apply', {
    parameters: ['subtag', 'args*'],
    returns: 'string',
    execute: async function apply(ctx, [{ value: subtagName }, ...args], subtag) {
        if (!ctx.canReplace(subtagName))
            throw new BBTagRuntimeError('No subtag found');

        const flatArgs = args
            .map(arg => arg.value)
            .flatMap(arg => bbtagArray.deserialize(arg)?.v ?? [arg])
            .map(v => parse.string(v));

        const source = `{${[subtagName, ...flatArgs].join(';')}}`;

        return await ctx.eval({
            values: [{
                name: {
                    start: subtag.start,
                    end: subtag.start,
                    values: [subtagName],
                    source: subtagName
                },
                args: flatArgs.map(arg => ({
                    start: subtag.start,
                    end: subtag.start,
                    values: [arg],
                    source: arg
                })),
                start: subtag.start,
                end: subtag.end,
                source
            }],
            start: subtag.start,
            end: subtag.end,
            source
        });
    }
});
