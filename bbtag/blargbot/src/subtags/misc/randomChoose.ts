import { randomInt } from 'node:crypto';

import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.randomChoose;

@Subtag.id('randomChoose', 'randChoose')
@Subtag.ctorArgs('arrayTools')
export class RandomChooseSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
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

        this.#arrayTools = arrayTools;
    }

    public async randChooseArg(choices: readonly SubtagArgument[]): Promise<string> {
        if (choices.length === 0)
            return '';

        return await choices[randomInt(choices.length)].wait();
    }

    public async randChoose(context: BBTagScript, arrayStr: string): Promise<JToken> {
        const choices = await this.#arrayTools.deserializeOrGetArray(context.runtime, arrayStr);
        if (choices === undefined)
            return arrayStr;

        if (choices.v.length === 0)
            return '';

        return choices.v[randomInt(choices.v.length)];
    }
}
