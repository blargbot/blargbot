import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class LowerSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lower',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.lowercase(text.value)
                }
            ]
        });
    }

    public lowercase(value: string): string {
        return value.toLowerCase();
    }
}
