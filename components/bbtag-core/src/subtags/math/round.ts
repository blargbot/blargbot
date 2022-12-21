import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class RoundSubtag extends Subtag {
    public constructor() {
        super({
            name: 'round'
        });
    }

    @Subtag.signature(p.number('number'))
        .returns('number')
    public round(value: number): number {
        return Math.round(value);
    }
}
