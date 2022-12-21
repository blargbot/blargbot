import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

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
