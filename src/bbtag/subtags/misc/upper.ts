import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.upper;

export class UpperSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'upper',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.uppercase(text.value)
                }
            ]
        });
    }

    public uppercase(text: string): string {
        return text.toUpperCase();
    }
}
