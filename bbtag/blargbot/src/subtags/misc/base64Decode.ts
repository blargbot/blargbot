import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class Base64DecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'base64Decode',
            aliases: ['aToB']
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.string('text'))
    public decode(base64: string): string {
        return Buffer.from(base64, 'base64').toString();
    }
}
