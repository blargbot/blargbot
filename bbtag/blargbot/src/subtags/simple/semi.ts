import { Subtag } from '@bbtag/subtag';

export class SemiSubtag extends Subtag {
    public constructor() {
        super({
            name: 'semi'
        });
    }

    @Subtag.signature({ id: 'default' })
    public getSemiColon(): ';' {
        return ';';
    }
}
