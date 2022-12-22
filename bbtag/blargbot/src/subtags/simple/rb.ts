import { Subtag } from '@bbtag/subtag';

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
