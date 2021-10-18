import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ReplaceSubtag extends BaseSubtag {
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
                    execute: (context, args) => {
                        context.state.replace = {
                            regex: args[0].value,
                            with: args[1].value
                        };
                    }
                },
                {
                    parameters: ['text', 'phrase', 'replaceWith'],
                    description: 'Replaces the first occurence of `phrase` in `text` with `replaceWith`.',
                    exampleCode: 'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}',
                    exampleOut: 'I like to nom ham. ham',
                    execute: (_, args) => {
                        return args[0].value.replace(args[1].value, args[2].value);
                    }
                }
            ]
        });
    }
}
