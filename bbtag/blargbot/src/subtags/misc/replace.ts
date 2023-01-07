import { emptyResultAdapter, Subtag } from '@bbtag/subtag';

import { ReplacementPlugin } from '../../plugins/ReplacementPlugin.js';
import { p } from '../p.js';

export class ReplaceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'replace'
        });
    }

    @Subtag.signature({ id: 'text' })
        .parameter(p.string('text'))
        .parameter(p.string('phrase'))
        .parameter(p.string('replacement'))
    public replace(text: string, phrase: string, replacement: string): string {
        return text.replace(phrase, replacement);
    }

    @Subtag.signature({ id: 'output' })
        .parameter(p.plugin(ReplacementPlugin))
        .parameter(p.string('phrase'))
        .parameter(p.string('replacement'))
        .convertResultUsing(emptyResultAdapter)
    public setOutputReplacement(context: ReplacementPlugin, phrase: string, replacement: string): void {
        context.replacer = v => v.replaceAll(phrase, replacement);
    }
}
