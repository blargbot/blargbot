import { defineReplacer } from '../defineReplacer.js';

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
