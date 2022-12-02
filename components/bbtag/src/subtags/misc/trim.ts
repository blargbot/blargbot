import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.trim;

export class TrimSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'trim',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.trim(text.value)
                }
            ]
        });
    }

    public trim(text: string): string {
        return text.trim();
    }
}
