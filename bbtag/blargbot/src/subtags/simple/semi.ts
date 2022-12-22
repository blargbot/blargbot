import { Subtag } from '@bbtag/subtag';

export class SemiSubtag extends Subtag {
    public constructor() {
        super({
            name: 'semi'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
    public getSemiColon(): ';' {
        return ';';
    }
}
