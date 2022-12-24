import { Subtag } from '@bbtag/subtag';

export class LbSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lb'
        });
    }

    @Subtag.signature({ id: 'default' })
    public getOpenBrace(): '{' {
        return '{';
    }
}
