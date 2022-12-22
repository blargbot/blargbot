import { Subtag } from '@bbtag/subtag';

import { ReplacementPlugin } from '../../plugins/ReplacementPlugin.js';
import { p } from '../p.js';

export class RegexReplaceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'regexReplace'
        });
    }

    @Subtag.signature({ id: 'output', returns: 'void' })
        .parameter(p.plugin(ReplacementPlugin))
        .parameter(p.regex('phrase', { maxSize: 50000 }))
        .parameter(p.string('replacement'))
    public setOutputReplacement(context: ReplacementPlugin, regex: RegExp, replacement: string): void {
        context.replacer = v => v.replace(regex, replacement);
    }

    @Subtag.signature({ id: 'text', returns: 'string' })
        .parameter(p.string('text'))
        .parameter(p.regex('phrase', { maxSize: 50000 }))
        .parameter(p.string('replacement'))
    public regexReplace(text: string, regex: RegExp, replacement: string): string {
        return text.replace(regex, replacement);
    }
}
