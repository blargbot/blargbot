import { Subtag } from '../../execution/Subtag.js';

export class SemiSubtag extends Subtag {
    public constructor() {
        super({
            name: 'semi'
        });
    }

    @Subtag.signature().returns('string')
    public getSemiColon(): ';' {
        return ';';
    }
}
