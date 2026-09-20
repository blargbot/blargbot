import { compileReplacer } from '../compileReplacer.js';
import type { ArgsLocals, AuthorizerLocals, AuthorLocals, CustomCommandLocals } from './locals.js';

export const lbReplacer = compileReplacer('lb', {
    parameters: [],
    returns: 'string',
    execute: function lb() { return '{'; }
});
export const rbReplacer = compileReplacer('rb', {
    parameters: [],
    returns: 'string',
    execute: function rb() { return '}'; }
});
export const semiReplacer = compileReplacer('semi', {
    parameters: [],
    returns: 'string',
    execute: function semi() { return ';'; }
});
export const zwsReplacer = compileReplacer('zws', {
    parameters: [],
    returns: 'string',
    execute: function zws() { return '\u200B'; }
});
export const argsArrayReplacer = compileReplacer<ArgsLocals>('argsArray', {
    parameters: [],
    returns: 'string[]',
    execute: function argsArray(ctx) { return ctx.locals.args.positional; }
});
export const argsLengthReplacer = compileReplacer<ArgsLocals>('argsLength', {
    parameters: [],
    returns: 'number',
    execute: function argsLength(ctx) { return ctx.locals.args.positional.length; }
});
export const isCustomCommandReplacer = compileReplacer<CustomCommandLocals>(['isCustomCommand', 'isCC'], {
    parameters: [],
    returns: 'boolean',
    execute: function isCustomCommand(ctx) { return ctx.locals.isCC; }
});
export const tagAuthorReplacer = compileReplacer<AuthorLocals>(['tagAuthor', 'customCommandAuthor', 'ccAuthor'], {
    parameters: [],
    returns: 'string',
    execute: function tagAuthor(ctx) { return ctx.locals.authorId; }
});
export const tagAuthorizerReplacer = compileReplacer<AuthorizerLocals>(['tagAuthorizer', 'customCommandAuthorizer', 'ccAuthorizer'], {
    parameters: [],
    returns: 'string',
    execute: function tagAuthorizer(ctx) { return ctx.locals.authorizerId; }
});
