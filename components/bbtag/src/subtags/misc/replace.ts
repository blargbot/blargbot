import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.replace;

@Subtag.names('replace')
@Subtag.ctorArgs()
export class ReplaceSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['phrase', 'replaceWith'],
                    description: tag.output.description,
                    exampleCode: tag.output.exampleCode,
                    exampleOut: tag.output.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [phrase, replacewith]) => this.setOutputReplacement(ctx, phrase.value, replacewith.value)
                },
                {
                    parameters: ['text', 'phrase', 'replaceWith'],
                    description: tag.text.description,
                    exampleCode: tag.text.exampleCode,
                    exampleOut: tag.text.exampleOut,
                    returns: 'string',
                    execute: (_, [text, phrase, replacewith]) => this.replace(text.value, phrase.value, replacewith.value)
                }
            ]
        });
    }

    public replace(text: string, phrase: string, replacement: string): string {
        return text.replace(phrase, replacement);
    }

    public setOutputReplacement(context: BBTagContext, phrase: string, replacement: string): void {
        context.data.replace = {
            regex: phrase,
            with: replacement
        };
    }
}
