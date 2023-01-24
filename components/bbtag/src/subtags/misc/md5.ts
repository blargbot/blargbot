import { createHash } from 'node:crypto';

import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.md5;

@Subtag.id('md5', 'md5encode')
@Subtag.ctorArgs()
export class Md5Subtag extends CompiledSubtag {
    public constructor() {
        super({
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
