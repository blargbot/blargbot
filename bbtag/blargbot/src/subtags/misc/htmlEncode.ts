import { Subtag } from '@bbtag/subtag';

import { HtmlPlugin } from '../../plugins/HtmlPlugin.js';
import { p } from '../p.js';

export class HtmlEncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'htmlEncode'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(HtmlPlugin))
        .parameter(p.string('text'))
    public htmlEncode(html: HtmlPlugin, text: string): string {
        return html.decode(text);
    }
}
