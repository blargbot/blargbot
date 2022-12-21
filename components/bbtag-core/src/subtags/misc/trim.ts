import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class TrimSubtag extends Subtag {
    public constructor() {
        super({
            name: 'trim'
        });
    }

    @Subtag.signature(p.string('text')).returns('string')
    public trim(text: string): string {
        return text.trim();
    }
}
