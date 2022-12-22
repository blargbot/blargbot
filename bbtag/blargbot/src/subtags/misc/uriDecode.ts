import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class UriDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'uriDecode'
        });
    }

    @Subtag.signature(p.string('text')).returns('string')
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
