import { random } from '@blargbot/util';

import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.randomChoose;

export class RandomChooseSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
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
        this.#variables = variables;
    }

    public async randChooseArg(choices: readonly SubtagArgument[]): Promise<string> {
        return await random.pick(choices).wait();
    }

    public async randChoose(context: BBTagContext, arrayStr: string): Promise<JToken> {
        const variables = this.#variables.forContext(context);
        const choices = await bbtag.tagArray.deserializeOrGetArray(variables, arrayStr);
        if (choices === undefined)
            return arrayStr;

        return random.pick(choices.v);
    }
}
