import { humanize } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class DecancerSubtag extends Subtag {
    public constructor() {
        super({
            name: 'decancer',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.decancer(text.value)
                }
            ]
        });
    }

    public decancer(text: string): string {
        return humanize.decancer(text);
    }
}
