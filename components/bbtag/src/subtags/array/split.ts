import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.split;

@Subtag.names('split')
@Subtag.ctorArgs()
export class SplitSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
