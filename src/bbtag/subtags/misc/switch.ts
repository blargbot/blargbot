import { parse } from '@blargbot/core/utils';

import { SubtagArgument } from '../../arguments';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.switch;

export class SwitchSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value', { repeat: ['case', '~then'], minCount: 1 }, '~default?'],
                    description: 'Compares `value` against each `case` and executes the first `then` that matches. If no matches are found, `default` is executed. Each `case` can optionally be an array to allow matching against multiple values.',
                    exampleCode: '{switch;{args;0};\n  hi;Hello!;\n  ["punch","bop","hit"];Got it, i\'ll hit {args;1} for you!;\n  I dont know how to do that!\n}',
                    exampleIn: 'hit Danny',
                    exampleOut: 'Got it, i\'ll hit Danny for you!',
                    returns: 'string',
                    execute: (_, [value, ...cases]) => this.switch(value.value, ...splitArgs(cases))
                }
            ]
        });
    }

    public async switch(
        value: string,
        cases: ReadonlyArray<readonly [string, SubtagArgument]>,
        defaultCase?: SubtagArgument
    ): Promise<string> {
        for (const [caseValue, then] of cases) {
            const { v: options = [caseValue] } = bbtag.tagArray.deserialize(caseValue) ?? {};
            for (const option of options)
                if (parse.string(option) === value)
                    return await then.execute();
        }
        return await defaultCase?.execute() ?? '';
    }
}

function splitArgs(args: SubtagArgument[]): [cases: ReadonlyArray<readonly [string, SubtagArgument]>, defaultCase?: SubtagArgument] {
    let defaultCase = undefined;
    if (args.length % 2 === 1)
        defaultCase = args.pop();

    const cases = [];
    for (let i = 0; i < args.length; i += 2)
        cases.push([args[i].value, args[i + 1]] as const);
    return [cases, defaultCase];
}
