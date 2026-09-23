import { defineReplacer } from '../defineReplacer.js';

export interface HtmlEncoderLocals {
    htmlEncoder: HtmlEncoder;
}
export interface HtmlEncoder {
    encode(text: string): string;
    decode(text: string): string;
}
export const htmlEncodeReplacer = defineReplacer<HtmlEncoderLocals>('htmlEncode', {
    parameters: ['text'],
    returns: 'string',
    execute: function htmlEncode(ctx, [{ value: text }]) {
        return ctx.locals.htmlEncoder.encode(text);// TODO: use subtag.source
    }
});
export const htmlDecodeReplacer = defineReplacer<HtmlEncoderLocals>('htmlDecode', {
    parameters: ['text+'],
    returns: 'string',
    execute: function htmlDecode(ctx, text) {
        return ctx.locals.htmlEncoder.decode(text.map(x => x.value).join(';'));
    }
});
