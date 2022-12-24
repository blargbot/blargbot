import { Subtag } from '@bbtag/subtag';

import { HtmlPlugin } from '../../plugins/HtmlPlugin.js';
import { p } from '../p.js';

export class HtmlDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'htmlDecode'
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.plugin(HtmlPlugin))
        .parameter(p.string('html').repeat().flatMap(v => v.join(';')))
    public htmlDecode(html: HtmlPlugin, text: string): string {
        return html.decode(text);
    }
}
