import { Subtag } from '../../execution/Subtag.js';

export class RbSubtag extends Subtag {
    public constructor() {
        super({
            name: 'rb'
        });
    }

    @Subtag.signature().returns('string')
    public getCloseBrace(): '}' {
        return '}';
    }
}
