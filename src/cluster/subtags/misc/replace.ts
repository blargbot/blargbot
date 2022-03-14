import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ReplaceSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'replace',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['phrase', 'replaceWith'],
                    description: 'Replaces the first occurence of `phrase` with `replaceWith`. This is executed on the output from the containing tag.',
                    exampleCode: 'Hello world! {replace;Hello;Bye}',
                    exampleOut: 'Bye world!',
                    returns: 'nothing',
                    execute: (ctx, [phrase, replacewith]) => this.setOutputReplacement(ctx, phrase.value, replacewith.value)
                },
                {
                    parameters: ['text', 'phrase', 'replaceWith'],
                    description: 'Replaces the first occurence of `phrase` in `text` with `replaceWith`.',
                    exampleCode: 'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}',
                    exampleOut: 'I like to nom ham. ham',
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
