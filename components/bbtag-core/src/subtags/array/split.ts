import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class SplitSubtag extends Subtag {
    public constructor() {
        super({
            name: 'split',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['text', 'splitter?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
