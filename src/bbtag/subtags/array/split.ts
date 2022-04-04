import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class SplitSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'split',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['text', 'splitter?'],
                    description: 'Splits `text` using `splitter`, and the returns an array.',
                    exampleCode: '{split;Hello! This is a sentence.;{space}}',
                    exampleOut: '["Hello!","This","is","a","sentence."]',
                    returns: 'string[]',
                    execute: (_, [text, splitter]) => this.split(text.value, splitter.value)
                }
            ]
        });
    }

    public split(text: string, splitter: string): string[] {
        return text.split(splitter);
    }
}
