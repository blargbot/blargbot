import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.lower;

export class LowerSubtag extends CompiledSubtag {
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
