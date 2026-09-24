import { NotEnoughArgumentsError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { ArgsLocals, AuthorizerLocals, AuthorLocals, CommandLocals, CustomCommandLocals, FlagsLocals, PrefixLocals } from './locals.js';

export const argsReplacer = defineReplacer<ArgsLocals>(
    'args',
    {
        parameters: [],
        returns: 'string',
        execute: function allArgs(ctx) {
            return ctx.locals.args.join(' ');
        }
    },
    {
        parameters: ['index'],
        returns: 'string',
        execute: function singleArg(ctx, [{ value: index }]) {
            const i = parse.int(index, { throw: true });

            if (ctx.locals.args.length <= i || i < 0)
                throw new NotEnoughArgumentsError(i + 1, ctx.locals.args.length);

            return ctx.locals.args[i];
        }
    },
    {
        parameters: ['start', 'end'],
        returns: 'string',
        execute: function sliceArgs(ctx, [{ value: start }, { value: end }]) {
            const args = ctx.locals.args;
            let from = parse.int(start, { throw: true });
            let to = end.toLowerCase() === 'n'
                ? args.length
                : parse.int(end, { throw: true });

            // TODO This behaviour should be documented
            [from, to] = [from, to].sort((a, b) => a - b);

            if (args.length <= from || from < 0)
                throw new NotEnoughArgumentsError(from + 1, args.length);

            return args.slice(from, to).join(' ');
        }
    }
);
export const argsArrayReplacer = defineReplacer<ArgsLocals>('argsArray', {
    parameters: [],
    returns: 'string[]',
    execute: function argsArray(ctx) { return ctx.locals.args; }
});
export const argsLengthReplacer = defineReplacer<ArgsLocals>('argsLength', {
    parameters: [],
    returns: 'number',
    execute: function argsLength(ctx) { return ctx.locals.args.length; }
});
export const commandNameReplacer = defineReplacer<CommandLocals>('commandName', {
    parameters: [],
    returns: 'string',
    execute: function commandNAme(ctx) { return ctx.locals.commmandName; }
});
export const isCustomCommandReplacer = defineReplacer<CustomCommandLocals>(['isCustomCommand', 'isCC'], {
    parameters: [],
    returns: 'boolean',
    execute: function isCustomCommand(ctx) { return ctx.locals.isCC; }
});
export const tagAuthorReplacer = defineReplacer<AuthorLocals>(['tagAuthor', 'customCommandAuthor', 'ccAuthor'], {
    parameters: [],
    returns: 'string',
    execute: function tagAuthor(ctx) { return ctx.locals.authorId; }
});
export const tagAuthorizerReplacer = defineReplacer<AuthorizerLocals>(['tagAuthorizer', 'customCommandAuthorizer', 'ccAuthorizer'], {
    parameters: [],
    returns: 'string',
    execute: function tagAuthorizer(ctx) { return ctx.locals.authorizerId; }
});
const flagChars = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''));
export const flagReplacer = defineReplacer<FlagsLocals>('flag', {
    parameters: ['flagName'],
    returns: 'string|nothing',
    execute: function flag(ctx, [{ value: flagName }]) {
        if (flagName !== '_' && !flagChars.has(flagName))
            return undefined;
        return ctx.locals.flags[flagName]?.join(' ');
    }
});
export const flagSetReplacer = defineReplacer<FlagsLocals>('flagSet', {
    parameters: ['flagName'],
    returns: 'boolean',
    execute: function flag(ctx, [{ value: flagName }]) {
        if (flagName !== '_' && !flagChars.has(flagName))
            return false;
        return ctx.locals.flags[flagName] !== undefined;
    }
});
export const flagsArrayReplacer = defineReplacer<FlagsLocals>('flagsArray', {
    parameters: [],
    returns: 'string[]',
    execute: function flagsArray(ctx) {
        return Object.keys(ctx.locals.flags);
    }
});
export const prefixReplacer = defineReplacer<PrefixLocals>('prefix', {
    parameters: [],
    returns: 'string',
    execute: function prefix(ctx) { return ctx.locals.prefix; }
});
