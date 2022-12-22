import { Subtag } from '@bbtag/subtag';

export class LbSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lb'
        });
    }

    @Subtag.signature().returns('string')
    public getOpenBrace(): '{' {
        return '{';
    }
}
