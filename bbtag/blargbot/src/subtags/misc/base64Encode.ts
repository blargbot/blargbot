import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class Base64EncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'base64Encode',
            aliases: ['bToA']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
    public encode(text: string): string {
        return Buffer.from(text).toString('base64');
    }
}
