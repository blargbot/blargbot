import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.clean;

export class CleanSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'clean',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text]) => this.clean(text.value)
                }
            ]
        });
    }

    public clean(text: string): string {
        return text.replace(/\s+/g, (match) => {
            if (match.includes('\n')) return '\n';
            if (match.includes('\t')) return '\t';
            return match[0];
        });
    }
}
