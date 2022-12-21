import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class RoundSubtag extends Subtag {
    public constructor() {
        super({
            name: 'round'
        });
    }

    @Subtag.signature(p.float('number')).returns('number')
    public round(number: number): number {
        return Math.round(number);
    }
}
