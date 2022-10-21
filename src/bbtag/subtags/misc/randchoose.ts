import { randChoose } from '@blargbot/core/utils';

import { SubtagArgument } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.randchoose;

export class RandChooseSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randchoose',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['choiceArray'],
                    description: tag.array.description,
                    exampleCode: tag.array.exampleCode,
                    exampleOut: tag.array.exampleOut,
                    returns: 'json',
                    execute: (ctx, [choice]) => this.randChoose(ctx, choice.value)
                },
                {
                    parameters: ['~choices+2'],
                    description: tag.args.description,
                    exampleCode: tag.args.exampleCode,
                    exampleOut: tag.args.exampleOut,
                    returns: 'string',
                    execute: (_, choices) => this.randChooseArg(choices)
                }
            ]
        });
    }

    public async randChooseArg(choices: readonly SubtagArgument[]): Promise<string> {
        return await randChoose(choices).wait();
    }

    public async randChoose(context: BBTagContext, arrayStr: string): Promise<JToken> {
        const choices = await bbtag.tagArray.deserializeOrGetArray(context, arrayStr);
        if (choices === undefined)
            return arrayStr;

        return randChoose(choices.v);
    }
}
