import { randChoose } from '@blargbot/core/utils/index.js';

import { SubtagArgument } from '../../arguments/index.js';
import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.randomChoose;

export class RandomChooseSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randomChoose',
            aliases: ['randChoose'],
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
