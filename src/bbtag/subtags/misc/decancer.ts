import { humanize } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.decancer;

export class DecancerSubtag extends CompiledSubtag {
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
