import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class UriEncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'uriEncode'
        });
    }

    @Subtag.signature(p.string('text')).returns('string')
    public encodeUri(text: string): string {
        return encodeURIComponent(text);
    }
}
