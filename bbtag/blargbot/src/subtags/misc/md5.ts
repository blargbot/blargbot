import { createHash } from 'node:crypto';

import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class Md5Subtag extends Subtag {
    public constructor() {
        super({
            name: 'md5',
            aliases: ['md5encode'],
            deprecated: true
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.string('text'))
    public md5Hash(value: string): string {
        const hash = createHash('md5');
        return hash.update(value).digest('hex');
    }
}
