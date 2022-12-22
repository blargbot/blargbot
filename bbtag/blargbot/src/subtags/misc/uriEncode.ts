import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class UriEncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'uriEncode'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.string('text'))
    public encodeUri(text: string): string {
        return encodeURIComponent(text);
    }
}
