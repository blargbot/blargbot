import { Subtag } from '@bbtag/subtag';

export class ZwsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'zws'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
    public getZws(): '\u200B' {
        return '\u200B';
    }
}
