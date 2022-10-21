import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.trim;

export class TrimSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'trim',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Trims whitespace and newlines before and after `text`.',
                    exampleCode: 'Hello {trim;{space;10}beautiful{space;10}} World',
                    exampleOut: 'Hello beautiful World',
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
