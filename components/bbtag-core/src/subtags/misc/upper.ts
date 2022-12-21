import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class UpperSubtag extends Subtag {
    public constructor() {
        super({
            name: 'upper'
        });
    }

    @Subtag.signature(p.string('text')).returns('string')
    public uppercase(text: string): string {
        return text.toUpperCase();
    }
}
