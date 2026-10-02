import { defineReplacer } from '../defineReplacer.js';

export interface HtmlEncoder {
    encodeHtml(text: string): string;
    decodeHtml(text: string): string;
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const htmlEncodeReplacerFactory = (options: HtmlEncoder) => defineReplacer('htmlEncode', {
    parameters: ['text'],
    returns: 'string',
    execute: function htmlEncode(_, [{ value: text }]) {
        return options.encodeHtml(text);// TODO: use subtag.source
    }
});
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const htmlDecodeReplacerFactory = (options: HtmlEncoder) => defineReplacer('htmlDecode', {
    parameters: ['text+'],
    returns: 'string',
    execute: function htmlDecode(_, text) {
        return options.decodeHtml(text.map(x => x.value).join(';'));
    }
});
