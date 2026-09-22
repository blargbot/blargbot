import { defineReplacer } from '../defineReplacer.js';
import type { ArgsLocals, AuthorizerLocals, AuthorLocals, CustomCommandLocals } from './locals.js';

export const lbReplacer = defineReplacer('lb', {
    parameters: [],
    returns: 'string',
    execute: function lb() { return '{'; }
});
export const rbReplacer = defineReplacer('rb', {
    parameters: [],
    returns: 'string',
    execute: function rb() { return '}'; }
});
export const semiReplacer = defineReplacer('semi', {
    parameters: [],
    returns: 'string',
    execute: function semi() { return ';'; }
});
export const zwsReplacer = defineReplacer('zws', {
    parameters: [],
    returns: 'string',
    execute: function zws() { return '\u200B'; }
});
export const argsArrayReplacer = defineReplacer<ArgsLocals>('argsArray', {
    parameters: [],
    returns: 'string[]',
    execute: function argsArray(ctx) { return ctx.locals.args.positional; }
});
export const argsLengthReplacer = defineReplacer<ArgsLocals>('argsLength', {
    parameters: [],
    returns: 'number',
    execute: function argsLength(ctx) { return ctx.locals.args.positional.length; }
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
