import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

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
