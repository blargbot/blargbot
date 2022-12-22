import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class UriDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'uriDecode'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.string('text'))
    public decodeUri(text: string): string {
        try {
            return decodeURIComponent(text);
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError(err.message);
            throw err;
        }
    }
}
