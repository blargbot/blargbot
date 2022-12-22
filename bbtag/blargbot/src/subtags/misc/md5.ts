import { createHash } from 'node:crypto';

import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class Md5Subtag extends Subtag {
    public constructor() {
        super({
            name: 'md5',
            aliases: ['md5encode'],
            category: SubtagType.MISC,
            deprecated: 'hash',
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.md5Hash(text.value)
                }
            ]
        });
    }

    public md5Hash(value: string): string {
        const hash = createHash('md5');
        return hash.update(value).digest('hex');
    }
}
