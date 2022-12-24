import { Subtag } from '@bbtag/subtag';

export class RbSubtag extends Subtag {
    public constructor() {
        super({
            name: 'rb'
        });
    }

    @Subtag.signature({ id: 'default' })
    public getCloseBrace(): '}' {
        return '}';
    }
}
