import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class ReplaceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'replace',
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
